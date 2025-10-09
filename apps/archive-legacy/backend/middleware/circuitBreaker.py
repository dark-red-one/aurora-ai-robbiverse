"""
circuitBreaker.py
=================
Circuit breaker middleware for API protection.

This prevents cascading failures by:
- Monitoring API call success/failure rates
- Opening circuit (blocking calls) when failure rate exceeds threshold
- Half-opening circuit periodically to test if service recovered
- Closing circuit when service is healthy again

States:
- CLOSED: Normal operation, all calls go through
- OPEN: Service is failing, all calls fail fast
- HALF_OPEN: Testing if service recovered

This protects the system from overwhelming failing services and enables graceful degradation.
"""

import time
import logging
from typing import Callable, Any, Optional
from enum import Enum
from dataclasses import dataclass
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Blocking calls
    HALF_OPEN = "half_open"  # Testing recovery


@dataclass
class CircuitBreakerConfig:
    """Circuit breaker configuration"""
    failure_threshold: int = 5  # Failures before opening
    success_threshold: int = 2  # Successes to close from half-open
    timeout: float = 60.0  # Seconds before half-open
    window_size: int = 100  # Rolling window size for metrics


class CircuitBreakerError(Exception):
    """Raised when circuit is open"""
    pass


class CircuitBreaker:
    """
    Circuit breaker implementation for protecting services
    """
    
    def __init__(self, name: str, config: Optional[CircuitBreakerConfig] = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.last_state_change: datetime = datetime.now()
        
        # Rolling window for metrics
        self.call_history = []  # List of (timestamp, success: bool)
        
        logger.info(f"🔌 Circuit breaker '{name}' initialized (threshold: {self.config.failure_threshold})")
    
    def _record_call(self, success: bool):
        """Record a call in the rolling window"""
        self.call_history.append((datetime.now(), success))
        
        # Keep only recent history
        cutoff = datetime.now() - timedelta(seconds=300)  # 5 minutes
        self.call_history = [
            (ts, s) for ts, s in self.call_history
            if ts > cutoff
        ]
        
        # Limit size
        if len(self.call_history) > self.config.window_size:
            self.call_history = self.call_history[-self.config.window_size:]
    
    def _check_timeout(self):
        """Check if circuit should move to half-open"""
        if self.state == CircuitState.OPEN and self.last_failure_time:
            elapsed = (datetime.now() - self.last_failure_time).total_seconds()
            if elapsed >= self.config.timeout:
                logger.info(f"🔄 Circuit '{self.name}' moving to HALF_OPEN (timeout: {elapsed:.1f}s)")
                self.state = CircuitState.HALF_OPEN
                self.success_count = 0
                self.last_state_change = datetime.now()
    
    def _open_circuit(self):
        """Open the circuit"""
        logger.warning(f"🔴 Circuit '{self.name}' OPENED (failures: {self.failure_count})")
        self.state = CircuitState.OPEN
        self.last_failure_time = datetime.now()
        self.last_state_change = datetime.now()
    
    def _close_circuit(self):
        """Close the circuit"""
        logger.info(f"🟢 Circuit '{self.name}' CLOSED (successes: {self.success_count})")
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_state_change = datetime.now()
    
    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute a function through the circuit breaker
        
        Args:
            func: Function to call
            *args, **kwargs: Function arguments
        
        Returns:
            Function result
        
        Raises:
            CircuitBreakerError: If circuit is open
        """
        # Check if circuit should move to half-open
        self._check_timeout()
        
        # If open, fail fast
        if self.state == CircuitState.OPEN:
            raise CircuitBreakerError(f"Circuit '{self.name}' is OPEN")
        
        # Try the call
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        
        except Exception as e:
            self._on_failure()
            raise e
    
    async def async_call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute an async function through the circuit breaker
        
        Args:
            func: Async function to call
            *args, **kwargs: Function arguments
        
        Returns:
            Function result
        
        Raises:
            CircuitBreakerError: If circuit is open
        """
        # Check if circuit should move to half-open
        self._check_timeout()
        
        # If open, fail fast
        if self.state == CircuitState.OPEN:
            raise CircuitBreakerError(f"Circuit '{self.name}' is OPEN")
        
        # Try the call
        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        
        except Exception as e:
            self._on_failure()
            raise e
    
    def _on_success(self):
        """Handle successful call"""
        self._record_call(True)
        
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.config.success_threshold:
                self._close_circuit()
        
        elif self.state == CircuitState.CLOSED:
            # Reset failure count on success
            self.failure_count = 0
    
    def _on_failure(self):
        """Handle failed call"""
        self._record_call(False)
        
        if self.state == CircuitState.HALF_OPEN:
            # Failed during recovery test, re-open
            logger.warning(f"⚠️ Circuit '{self.name}' failed during recovery test, re-opening")
            self._open_circuit()
        
        elif self.state == CircuitState.CLOSED:
            self.failure_count += 1
            if self.failure_count >= self.config.failure_threshold:
                self._open_circuit()
    
    def get_metrics(self) -> dict:
        """Get circuit breaker metrics"""
        # Calculate success rate from recent history
        if self.call_history:
            recent_successes = sum(1 for _, success in self.call_history if success)
            success_rate = recent_successes / len(self.call_history)
        else:
            success_rate = 1.0
        
        return {
            'name': self.name,
            'state': self.state.value,
            'failure_count': self.failure_count,
            'success_count': self.success_count,
            'success_rate': success_rate,
            'total_calls': len(self.call_history),
            'last_state_change': self.last_state_change.isoformat(),
            'uptime_since_last_change': (datetime.now() - self.last_state_change).total_seconds()
        }
    
    def reset(self):
        """Manually reset the circuit breaker"""
        logger.info(f"🔄 Manually resetting circuit '{self.name}'")
        self._close_circuit()


class CircuitBreakerRegistry:
    """
    Registry for managing multiple circuit breakers
    """
    
    def __init__(self):
        self.breakers: dict[str, CircuitBreaker] = {}
    
    def get(self, name: str, config: Optional[CircuitBreakerConfig] = None) -> CircuitBreaker:
        """Get or create a circuit breaker"""
        if name not in self.breakers:
            self.breakers[name] = CircuitBreaker(name, config)
        return self.breakers[name]
    
    def get_all_metrics(self) -> dict:
        """Get metrics for all circuit breakers"""
        return {
            name: breaker.get_metrics()
            for name, breaker in self.breakers.items()
        }
    
    def reset_all(self):
        """Reset all circuit breakers"""
        for breaker in self.breakers.values():
            breaker.reset()


# Global registry
_registry = CircuitBreakerRegistry()


def get_circuit_breaker(name: str, config: Optional[CircuitBreakerConfig] = None) -> CircuitBreaker:
    """Get a circuit breaker from the global registry"""
    return _registry.get(name, config)


def get_all_circuit_metrics() -> dict:
    """Get metrics for all circuit breakers"""
    return _registry.get_all_metrics()


# Decorator for easy use
def circuit_breaker(name: str, config: Optional[CircuitBreakerConfig] = None):
    """
    Decorator to protect a function with a circuit breaker
    
    Usage:
        @circuit_breaker("my_service")
        def my_function():
            # ...
    """
    def decorator(func):
        breaker = get_circuit_breaker(name, config)
        
        if asyncio.iscoroutinefunction(func):
            async def async_wrapper(*args, **kwargs):
                return await breaker.async_call(func, *args, **kwargs)
            return async_wrapper
        else:
            def sync_wrapper(*args, **kwargs):
                return breaker.call(func, *args, **kwargs)
            return sync_wrapper
    
    return decorator


# Example usage
if __name__ == "__main__":
    import asyncio
    
    # Create circuit breaker
    breaker = get_circuit_breaker("test_service", CircuitBreakerConfig(
        failure_threshold=3,
        success_threshold=2,
        timeout=5.0
    ))
    
    # Simulate some calls
    def flaky_service(should_fail=False):
        """Simulated service that might fail"""
        if should_fail:
            raise Exception("Service failed!")
        return "Success"
    
    print("🧪 Testing circuit breaker...")
    
    # Successful calls
    for i in range(5):
        try:
            result = breaker.call(flaky_service, should_fail=False)
            print(f"✅ Call {i+1}: {result}")
        except CircuitBreakerError as e:
            print(f"⚠️ Call {i+1}: {e}")
        except Exception as e:
            print(f"❌ Call {i+1}: {e}")
    
    print(f"\n📊 State: {breaker.state.value}")
    
    # Now fail calls
    print("\n🔥 Triggering failures...")
    for i in range(5):
        try:
            result = breaker.call(flaky_service, should_fail=True)
            print(f"✅ Call {i+1}: {result}")
        except CircuitBreakerError as e:
            print(f"⚠️ Call {i+1}: Circuit is OPEN")
        except Exception as e:
            print(f"❌ Call {i+1}: Failed")
    
    print(f"\n📊 State: {breaker.state.value}")
    print(f"📊 Metrics: {breaker.get_metrics()}")
    
    # Wait for timeout
    print(f"\n⏳ Waiting {breaker.config.timeout}s for circuit to half-open...")
    time.sleep(breaker.config.timeout + 1)
    
    # Try again
    try:
        breaker.call(flaky_service, should_fail=False)
        print(f"✅ Recovery test passed")
    except Exception as e:
        print(f"❌ Recovery test failed: {e}")
    
    print(f"\n📊 Final state: {breaker.state.value}")
    print(f"📊 Final metrics: {breaker.get_metrics()}")


