import face_recognition
import numpy as np
import cv2
import os

print("Libraries imported successfully!")
print(f"Face recognition version: {face_recognition.__version__}")

# Create a simple test image
test_img = np.ones((100, 100, 3), dtype=np.uint8) * 255
print("Created test image successfully!")

print("All tests passed!") 