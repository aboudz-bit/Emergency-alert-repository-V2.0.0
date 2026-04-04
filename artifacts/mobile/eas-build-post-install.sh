#!/bin/bash
set -e
echo "Removing react-native-google-maps podspec to prevent iOS Google Maps pod dependency..."
rm -f node_modules/react-native-maps/react-native-google-maps.podspec
echo "Done."
