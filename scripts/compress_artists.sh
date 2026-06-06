#!/bin/bash

# Ensure output directory exists
OUTPUT_DIR="../images/artists"
mkdir -p "$OUTPUT_DIR"

# Target input directory
INPUT_DIR="/Users/mac/Downloads/THIRSTY CLUB 999"

# Allow custom input directory as argument
if [ ! -z "$1" ]; then
  INPUT_DIR="$1"
fi

echo "=================================================="
echo "Artist Photo Optimizer & Compressor using sips"
echo "=================================================="
echo "Source: $INPUT_DIR"
echo "Destination: $OUTPUT_DIR"
echo "--------------------------------------------------"

if [ ! -d "$INPUT_DIR" ]; then
  echo "Error: Directory '$INPUT_DIR' does not exist."
  echo "Please download the folder from Google Drive and place it in your Downloads folder."
  echo "Or run: ./compress_artists.sh \"/path/to/THIRSTY CLUB 999\""
  exit 1
fi

normalize_name() {
  local name="$1"
  # convert to lowercase
  name=$(echo "$name" | tr '[:upper:]' '[:lower:]')
  # replace '$' with 's'
  name=$(echo "$name" | sed 's/\$/s/g')
  # replace spaces with underscores
  name=$(echo "$name" | tr ' ' '_')
  # remove any other non-alphanumeric/non-underscore characters
  name=$(echo "$name" | sed 's/[^a-z0-9_]//g')
  echo "$name"
}

# Counter for successfully processed images
count=0

# Loop through subdirectories
find "$INPUT_DIR" -mindepth 1 -maxdepth 1 -type d | while read -r artist_dir; do
  artist_name=$(basename "$artist_dir")
  normalized=$(normalize_name "$artist_name")
  
  echo "Processing artist: $artist_name (Normalized: $normalized)..."
  
  # Find the first image file in the artist folder
  img_file=$(find "$artist_dir" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" -o -iname "*.heic" -o -iname "*.tiff" \) | head -n 1)
  
  if [ -z "$img_file" ]; then
    echo "  -> Warning: No image found in folder '$artist_name'"
    continue
  fi
  
  ext="${img_file##*.}"
  output_file="$OUTPUT_DIR/${normalized}.jpg"
  
  echo "  -> Found image: $(basename "$img_file")"
  
  # Compress and resize using macOS built-in sips tool
  # Resample to max 500px on the longest side, convert to jpeg at 80% quality
  sips -s format jpeg -s formatOptions 80 --resampleHeightWidthMax 500 "$img_file" --out "$output_file" &>/dev/null
  
  if [ -f "$output_file" ]; then
    echo "  -> Success: Compressed and saved to images/artists/${normalized}.jpg"
    ((count++))
  else
    echo "  -> Error: Failed to compress image for $artist_name"
  fi
done

echo "--------------------------------------------------"
echo "Done! Processed $count artist image(s)."
echo "=================================================="
