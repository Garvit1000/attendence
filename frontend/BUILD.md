# Building the App

## Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your Gemini API key to `.env`:
```
EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

## Development Build

```bash
# Install dependencies
npm install

# Start development server
npm start
```

## Production Build

1. Set up EAS build:
```bash
npm install -g eas-cli
eas login
```

2. Create the Android build:
```bash
# Make sure your Gemini API key is set in eas.json under the production configuration
npm run build:android
```

## Troubleshooting

### Gemini API Not Working in Production

If the Gemini API doesn't work in production:

1. Verify your API key is correctly set in `eas.json` under the production configuration:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

2. Rebuild the app with the correct API key:
```bash
npm run build:android
```

### Loading Skeletons Not Showing

If loading skeletons aren't visible:

1. Clear the app cache
2. Reinstall the app
3. Make sure you're connected to the internet when first launching the app

For any other issues, please refer to the project repository's issues section.