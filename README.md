# Stanford Golf Calling Agent 🏌️‍♂️📱

An AI-powered Android application that automatically calls Stanford golf course to make bookings on your behalf. Built with modern Android development practices using Kotlin, Jetpack Compose, and Material Design 3.

## Features

- **Automated Golf Booking**: AI agent that can call Stanford golf course to make reservations
- **Modern Android UI**: Built with Jetpack Compose and Material Design 3
- **Call Management**: Create, track, and manage golf booking calls
- **Dark Theme Support**: Comprehensive light and dark theme implementation
- **Stanford Branding**: Custom color scheme inspired by Stanford Cardinal colors
- **Local Storage**: Room database for persistent data storage

## Tech Stack

- **Language**: Kotlin
- **UI Framework**: Jetpack Compose
- **Architecture**: MVVM with Hilt dependency injection
- **Database**: Room
- **Background Tasks**: WorkManager
- **Navigation**: Navigation Compose
- **Design**: Material Design 3

## Requirements

- Android 8.0 (API level 26) or higher
- Android Studio Iguana or later
- JDK 11 or higher

## Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/shanekoh/Stanford-Golf-calling-agent.git
   cd Stanford-Golf-calling-agent
   ```

2. **Open in Android Studio**:
   - Open Android Studio
   - Select "Open an existing project"
   - Navigate to the cloned repository folder
   - Wait for Gradle sync to complete

3. **Build and Run**:
   - Connect an Android device or start an emulator
   - Click the "Run" button or use `Ctrl+R`

## Project Structure

```
app/
├── src/main/
│   ├── java/com/stanford/golf/calling/agents/
│   │   ├── ui/screen/          # Compose screens
│   │   ├── data/               # Data layer (Room, repositories)
│   │   ├── domain/             # Business logic
│   │   └── di/                 # Dependency injection
│   └── res/
│       ├── values/             # Colors, strings, themes
│       └── values-night/       # Dark theme resources
```

## Key Components

### CallCreationScreen
The main screen for creating and managing golf booking calls. Features:
- Form inputs for booking details
- Call status tracking
- Material Design 3 components

### Color Theme
Custom color palette inspired by Stanford and golf course aesthetics:
- **Stanford Cardinal**: Primary brand color
- **Golf Green**: Secondary colors for nature theme
- **Comprehensive theming**: Full light/dark theme support

### Dependencies
- **Hilt**: Dependency injection
- **Room**: Local database
- **Navigation Compose**: Screen navigation
- **WorkManager**: Background task management
- **Material 3**: Modern UI components

## Configuration

The app uses the following key configurations:
- **Compile SDK**: 34 (Android 14)
- **Target SDK**: 34
- **Min SDK**: 26 (Android 8.0)
- **JDK Image Transform**: Disabled for compatibility

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## Build Issues Resolution

If you encounter build issues:

1. **AAR Metadata Errors**: Ensure `compileSdk` and `targetSdk` are set to 34
2. **Resource Linking Errors**: Verify all theme colors are defined in both light and dark variants
3. **JDK Image Transform Errors**: Confirm `android.enableJdkImageTransform=false` in `gradle.properties`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or support, please open an issue on GitHub.

---

🏌️ Built with ❤️ for Stanford Golf enthusiasts


