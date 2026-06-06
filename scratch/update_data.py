import sys

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of EXTRA_STATIONS
marker = 'const EXTRA_STATIONS = ['
idx = content.find(marker)
if idx != -1:
    content = content[:idx]

with open('scratch/all_stations.txt', 'r', encoding='utf-8') as f:
    extra = f.read()

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(content)
    f.write(extra)
