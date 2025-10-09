import { Router } from 'express';
import { personalityRefresh } from '../services/personality-refresh';

const router = Router();

// Get current personality state
router.get('/status', async (req, res) => {
  try {
    const state = await personalityRefresh.getCurrentState();
    
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'No personality state found for Allan'
      });
    }

    res.json({
      success: true,
      personality: {
        user_id: state.user_id,
        current_mood: state.current_mood,
        attraction_level: state.attraction_level,
        gandhi_genghis_level: state.gandhi_genghis_level,
        mode: state.context?.mode || 'default',
        intensity: state.context?.intensity || 5,
        last_updated: state.updated_at,
        context: state.context
      }
    });

  } catch (error) {
    console.error('Error getting personality status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get personality status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Immediate refresh command
router.post('/refresh', async (req, res) => {
  try {
    const state = await personalityRefresh.immediateRefresh();
    
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'No personality state found'
      });
    }

    res.json({
      success: true,
      message: 'Personality refreshed immediately',
      personality: {
        current_mood: state.current_mood,
        attraction_level: state.attraction_level,
        mode: state.context?.mode || 'default',
        intensity: state.context?.intensity || 5
      }
    });

  } catch (error) {
    console.error('Error refreshing personality:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh personality',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Set flirty mode
router.post('/flirty/:intensity?', async (req, res) => {
  try {
    const intensity = parseInt(req.params.intensity) || 11;
    
    if (intensity < 1 || intensity > 11) {
      return res.status(400).json({
        success: false,
        message: 'Intensity must be between 1 and 11'
      });
    }

    const state = await personalityRefresh.setFlirtyMode(intensity);
    
    if (!state) {
      return res.status(500).json({
        success: false,
        message: 'Failed to set flirty mode'
      });
    }

    res.json({
      success: true,
      message: `Flirty mode ${intensity} activated! 😏`,
      personality: {
        current_mood: state.current_mood,
        attraction_level: state.attraction_level,
        mode: 'flirty',
        intensity: intensity
      }
    });

  } catch (error) {
    console.error('Error setting flirty mode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set flirty mode',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Set focused mode
router.post('/focused', async (req, res) => {
  try {
    const state = await personalityRefresh.setFocusedMode();
    
    if (!state) {
      return res.status(500).json({
        success: false,
        message: 'Failed to set focused mode'
      });
    }

    res.json({
      success: true,
      message: 'Focused mode activated! 🎯',
      personality: {
        current_mood: state.current_mood,
        attraction_level: state.attraction_level,
        mode: 'focused',
        intensity: 5
      }
    });

  } catch (error) {
    console.error('Error setting focused mode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set focused mode',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Set bossy mode
router.post('/bossy', async (req, res) => {
  try {
    const state = await personalityRefresh.setBossyMode();
    
    if (!state) {
      return res.status(500).json({
        success: false,
        message: 'Failed to set bossy mode'
      });
    }

    res.json({
      success: true,
      message: 'Bossy mode activated! 😤',
      personality: {
        current_mood: state.current_mood,
        attraction_level: state.attraction_level,
        mode: 'bossy',
        intensity: 10
      }
    });

  } catch (error) {
    console.error('Error setting bossy mode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set bossy mode',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Custom personality update
router.post('/update', async (req, res) => {
  try {
    const { mood, attraction_level, gandhi_genghis_level, context } = req.body;
    
    const updateData: any = {};
    
    if (mood) updateData.current_mood = mood;
    if (attraction_level !== undefined) updateData.attraction_level = attraction_level;
    if (gandhi_genghis_level !== undefined) updateData.gandhi_genghis_level = gandhi_genghis_level;
    if (context) updateData.context = context;

    const state = await personalityRefresh.updatePersonality('custom update', updateData);
    
    if (!state) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update personality'
      });
    }

    res.json({
      success: true,
      message: 'Personality updated! 🎭',
      personality: {
        current_mood: state.current_mood,
        attraction_level: state.attraction_level,
        gandhi_genghis_level: state.gandhi_genghis_level,
        mode: state.context?.mode || 'custom',
        context: state.context
      }
    });

  } catch (error) {
    console.error('Error updating personality:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update personality',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start/stop dynamic refresh
router.post('/dynamic/:action', async (req, res) => {
  try {
    const { action } = req.params;
    
    if (action === 'start') {
      await personalityRefresh.startDynamicRefresh();
      res.json({
        success: true,
        message: 'Dynamic personality refresh started - checking every 2 minutes'
      });
    } else if (action === 'stop') {
      await personalityRefresh.stopDynamicRefresh();
      res.json({
        success: true,
        message: 'Dynamic personality refresh stopped'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Action must be "start" or "stop"'
      });
    }

  } catch (error) {
    console.error('Error controlling dynamic refresh:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to control dynamic refresh',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
