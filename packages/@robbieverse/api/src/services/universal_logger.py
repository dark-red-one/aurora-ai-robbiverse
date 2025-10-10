"""
Universal Logger - Dual logging system (file + SQL)
=====================================================
Logs all AI requests to both file and database with NO sensitive data.
File logs: /var/log/robbie/universal-input.log
SQL logs: ai_request_logs table
"""

import os
import logging
from logging.handlers import TimedRotatingFileHandler
from datetime import datetime
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import Json
import uuid

# Configure file logging
LOG_DIR = os.getenv("ROBBIE_LOG_DIR", os.path.expanduser("~/robbie-logs"))
LOG_FILE = os.path.join(LOG_DIR, "universal-input.log")

# Create log directory if it doesn't exist
os.makedirs(LOG_DIR, exist_ok=True)

# Set up file logger
file_handler = TimedRotatingFileHandler(
    LOG_FILE,
    when="midnight",
    interval=1,
    backupCount=90  # Keep 90 days of logs
)
file_handler.setFormatter(
    logging.Formatter('[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s')
)

logger = logging.getLogger("universal_input")
logger.setLevel(logging.INFO)
logger.addHandler(file_handler)

# Add console handler for development
console_handler = logging.StreamHandler()
console_handler.setFormatter(
    logging.Formatter('[%(asctime)s] [%(levelname)s] %(message)s')
)
logger.addHandler(console_handler)


class UniversalLogger:
    """Dual logging system for AI requests"""
    
    def __init__(self, db_connection_string: str = None):
        self.db_conn_string = db_connection_string or os.getenv(
            "DATABASE_URL",
            "postgresql://allan:fun2Gus!!!@localhost:5432/aurora"
        )
        self.logger = logger
    
    def _get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(self.db_conn_string)
    
    def _sanitize_input(self, input_text: str, max_length: int = 200) -> str:
        """
        Sanitize input to remove sensitive data
        Returns a safe summary for logging
        """
        if not input_text:
            return ""
        
        # Keywords that indicate sensitive data
        sensitive_keywords = [
            'password', 'token', 'secret', 'key', 'api_key',
            'credit_card', 'ssn', 'social_security'
        ]
        
        lower_text = input_text.lower()
        if any(keyword in lower_text for keyword in sensitive_keywords):
            return "[REDACTED - Contains sensitive keywords]"
        
        # Truncate to max length
        if len(input_text) > max_length:
            return input_text[:max_length] + "..."
        
        return input_text
    
    def log_request(
        self,
        request_id: str,
        source: str,
        ai_service: str,
        input_summary: str,
        source_metadata: Dict[str, Any] = None,
        user_id: str = "allan",
        town_id: str = "aurora"
    ) -> None:
        """
        Log an incoming AI request
        
        Args:
            request_id: Unique request identifier
            source: Source of request (email, chat, etc.)
            ai_service: AI service type (chat, embedding, etc.)
            input_summary: Safe summary of input (NO sensitive data)
            source_metadata: Additional metadata about the source
            user_id: User making the request
            town_id: Town/node processing the request
        """
        # Sanitize input
        safe_input = self._sanitize_input(input_summary)
        
        # Log to file
        self.logger.info(
            f"[{source}] [{ai_service}] [{request_id}] Request: {safe_input}"
        )
        
        # Log to database
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO ai_request_logs (
                    request_id, timestamp, source, source_metadata,
                    ai_service, input_summary, user_id, town_id
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                request_id,
                datetime.now(),
                source,
                Json(source_metadata or {}),
                ai_service,
                safe_input,
                user_id,
                town_id
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
        except Exception as e:
            self.logger.error(f"Failed to log request to database: {e}")
    
    def log_response(
        self,
        request_id: str,
        output_summary: str,
        gatekeeper_status: str,
        gatekeeper_confidence: float,
        gatekeeper_reasoning: str,
        processing_time_ms: int,
        ai_model: str = None,
        tokens_used: int = None
    ) -> None:
        """
        Log AI response and gatekeeper review
        
        Args:
            request_id: Request identifier
            output_summary: Safe summary of output (NO sensitive data)
            gatekeeper_status: approved/rejected/blocked/revised
            gatekeeper_confidence: Confidence score (0-1)
            gatekeeper_reasoning: Why gatekeeper made this decision
            processing_time_ms: Total processing time
            ai_model: Model used for response
            tokens_used: Tokens consumed
        """
        # Sanitize output
        safe_output = self._sanitize_input(output_summary)
        
        # Log to file
        self.logger.info(
            f"[{request_id}] Response: {gatekeeper_status} "
            f"(confidence: {gatekeeper_confidence:.2f}) - {safe_output}"
        )
        
        # Update database
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE ai_request_logs SET
                    output_summary = %s,
                    gatekeeper_status = %s,
                    gatekeeper_confidence = %s,
                    gatekeeper_reasoning = %s,
                    processing_time_ms = %s,
                    ai_model = %s,
                    tokens_used = %s
                WHERE request_id = %s
            """, (
                safe_output,
                gatekeeper_status,
                gatekeeper_confidence,
                gatekeeper_reasoning,
                processing_time_ms,
                ai_model,
                tokens_used,
                request_id
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
        except Exception as e:
            self.logger.error(f"Failed to log response to database: {e}")
    
    def log_gatekeeper_block(
        self,
        request_id: str,
        block_reason: str,
        block_category: str,
        severity: str,
        source: str,
        input_pattern: str = None,
        triggered_killswitch: bool = False,
        user_id: str = "allan"
    ) -> None:
        """
        Log a gatekeeper security block
        
        Args:
            request_id: Request that was blocked
            block_reason: Why it was blocked
            block_category: Category of block (rate_limit, suspicious, etc.)
            severity: low/medium/high/critical
            source: Source of request
            input_pattern: Sanitized pattern that triggered block
            triggered_killswitch: Whether this triggered killswitch
            user_id: User whose request was blocked
        """
        # Log to file
        self.logger.warning(
            f"[BLOCKED] [{request_id}] {block_reason} "
            f"(category: {block_category}, severity: {severity})"
        )
        
        # Log to database
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO gatekeeper_blocks (
                    request_id, block_reason, block_category, severity,
                    source, input_pattern, triggered_killswitch, user_id
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                request_id,
                block_reason,
                block_category,
                severity,
                source,
                self._sanitize_input(input_pattern) if input_pattern else None,
                triggered_killswitch,
                user_id
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
        except Exception as e:
            self.logger.error(f"Failed to log gatekeeper block to database: {e}")
    
    def log_monitoring_metric(
        self,
        metric_type: str,
        metric_name: str,
        metric_value: float,
        metric_unit: str = None,
        service_name: str = None,
        town_id: str = "aurora",
        metadata: Dict[str, Any] = None
    ) -> None:
        """
        Log a monitoring metric
        
        Args:
            metric_type: system/service/security/ai
            metric_name: Name of the metric
            metric_value: Numeric value
            metric_unit: Unit (percent, ms, count, bytes)
            service_name: Name of service being monitored
            town_id: Town generating the metric
            metadata: Additional metadata
        """
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO monitoring_metrics (
                    metric_type, metric_name, metric_value, metric_unit,
                    service_name, town_id, metadata
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                metric_type,
                metric_name,
                metric_value,
                metric_unit,
                service_name,
                town_id,
                Json(metadata or {})
            ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
        except Exception as e:
            self.logger.error(f"Failed to log monitoring metric: {e}")
    
    def get_recent_blocks(self, limit: int = 10) -> list:
        """Get recent gatekeeper blocks"""
        try:
            conn = self._get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    request_id, timestamp, block_reason, block_category,
                    severity, source, triggered_killswitch
                FROM gatekeeper_blocks
                ORDER BY timestamp DESC
                LIMIT %s
            """, (limit,))
            
            blocks = []
            for row in cursor.fetchall():
                blocks.append({
                    'request_id': str(row[0]),
                    'timestamp': row[1].isoformat(),
                    'block_reason': row[2],
                    'block_category': row[3],
                    'severity': row[4],
                    'source': row[5],
                    'triggered_killswitch': row[6]
                })
            
            cursor.close()
            conn.close()
            
            return blocks
            
        except Exception as e:
            self.logger.error(f"Failed to get recent blocks: {e}")
            return []


# Global logger instance
universal_logger = UniversalLogger()


