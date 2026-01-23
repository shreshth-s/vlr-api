import requests
import json

API_BASE = 'http://localhost:3000/api'

def pretty_print(title, data):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)
    print(json.dumps(data, indent=2))

# 1. Get Live Matches
print("\nFetching live matches...")
response = requests.get(f'{API_BASE}/matches/live')
live_matches = response.json()
pretty_print("LIVE MATCHES", live_matches)

# 2. Get Upcoming Matches
print("\nFetching upcoming matches...")
response = requests.get(f'{API_BASE}/matches/upcoming')
upcoming = response.json()
# Show first 3 only
if upcoming.get('success') and upcoming.get('data'):
    upcoming['data'] = upcoming['data'][:3]
pretty_print("UPCOMING MATCHES (first 3)", upcoming)

# 3. Get Team Rankings (NA region)
print("\nFetching NA team rankings...")
response = requests.get(f'{API_BASE}/teams/rankings/na')
rankings = response.json()
# Show top 5 only
if rankings.get('success') and rankings.get('data'):
    rankings['data'] = rankings['data'][:5]
pretty_print("NA TEAM RANKINGS (top 5)", rankings)

# 4. Get Stats Leaderboard with filters
print("\nFetching stats leaderboard (NA region, last 60 days)...")
response = requests.get(f'{API_BASE}/players/stats', params={
    'region': 'na',
    'timespan': '60',
    'min_rounds': 100
})
stats = response.json()
# Show top 3 only
if stats.get('success') and stats.get('data'):
    stats['data'] = stats['data'][:3]
pretty_print("STATS LEADERBOARD (top 3 NA players)", stats)

# 5. Get Ongoing Events
print("\nFetching ongoing events...")
response = requests.get(f'{API_BASE}/events', params={'status': 'ongoing'})
events = response.json()
if events.get('success') and events.get('data'):
    events['data'] = events['data'][:5]
pretty_print("ONGOING EVENTS (first 5)", events)

# 6. Get Available Regions
print("\nFetching available regions...")
response = requests.get(f'{API_BASE}/teams/regions')
regions = response.json()
pretty_print("AVAILABLE REGIONS", regions)

print("\n" + "="*60)
print("  EXAMPLE COMPLETE!")
print("="*60)
