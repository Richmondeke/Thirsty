#!/bin/bash

# Output directory in the project
OUTPUT_DIR="../images"
mkdir -p "$OUTPUT_DIR"

# Source directory
INPUT_DIR="/Users/mac/Downloads/THIR\$TY PHOTOS"

echo "=================================================="
echo "Past Editions Image Compressor"
echo "=================================================="
echo "Source: $INPUT_DIR"
echo "Destination: $OUTPUT_DIR"
echo "--------------------------------------------------"

if [ ! -d "$INPUT_DIR" ]; then
  # Try without escaped slash just in case
  INPUT_DIR="/Users/mac/Downloads/THIR\$TY PHOTOS"
  if [ ! -d "$INPUT_DIR" ]; then
    echo "Error: Directory '$INPUT_DIR' not found."
    exit 1
  fi
fi

count=0

# Loop through all images in input folder
find "$INPUT_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | while read -r img_path; do
  filename=$(basename "$img_path")
  # Convert filename to lowercase and replace spaces
  clean_filename=$(echo "$filename" | tr '[:upper:]' '[:lower:]' | tr ' ' '_')
  output_file="$OUTPUT_DIR/opt_$clean_filename"
  
  echo "Compressing $filename -> opt_$clean_filename..."
  
  # Resample to max 1000px (longest side) for high quality lightbox, convert to JPEG format at 80% quality
  sips -s format jpeg -s formatOptions 80 --resampleHeightWidthMax 1000 "$img_path" --out "$output_file" &>/dev/null
  
  if [ -f "$output_file" ]; then
    echo "  -> Success! Size: $(du -sh "$output_file" | cut -f1)"
    ((count++))
  else
    echo "  -> Error compressing $filename"
  fi
done

echo "--------------------------------------------------"
echo "Done! Compressed $count image(s)."
echo "================================================--"
