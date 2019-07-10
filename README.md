# Weather bot for Discord
Provides weather information through discord

### Features:
    - Current rainfall amount   ✓
    - Weather Forecast
        - 2 hour forecast       ✓
        - 24 hours              ✗ (Becomes region based, unaccurate)
        - Weekly                ✗ (Becomes region based, unaccurate)
        - Alternative locations ✓ (SubZones -> nearest Zone);
    - Alarm system
        - Subscriber system     ✓
        - Database required     ✓

### Current alarm system:
    - Every two hours:
        - Get list of subscribers from database
        - Check weather of areas interested
        - Send DM if going to rain     
    
### TODO
    - Make use of rainfall amount?
    - Add temperature?
    - Add voice DM?