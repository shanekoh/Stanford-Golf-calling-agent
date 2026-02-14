@echo off
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\ksx19\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%
cd /d C:\Users\ksx19\Stanford-Golf-calling-agent\mobile\android
call "%~dp0gradlew.bat" app:installDebug -PreactNativeDevServerPort=8081
