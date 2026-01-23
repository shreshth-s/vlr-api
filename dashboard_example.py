"""
VLR.gg Dashboard Data Fetcher
Demonstrates how to fetch and structure data for a dashboard
"""

import requests
from datetime import datetime

API_BASE = 'http://localhost:3000/api'


class VLRDashboard:
    """Fetch and organize VLR data for dashboard display"""

    def __init__(self):
        self.data = {}

    def fetch_all(self):
        """Fetch all dashboard data"""
        print("Fetching dashboard data...\n")

        self.data = {
            'live_matches': self.get_live_matches(),
            'upcoming_matches': self.get_upcoming_matches(limit=5),
            'recent_results': self.get_recent_results(limit=5),
            'top_players': self.get_top_players(region='na', limit=10),
            'team_rankings': self.get_team_rankings(region='na', limit=10),
            'ongoing_events': self.get_ongoing_events(),
            'fetched_at': datetime.now().isoformat()
        }

        return self.data

    def get_live_matches(self):
        """Get currently live matches"""
        try:
            response = requests.get(f'{API_BASE}/matches/live', timeout=10)
            data = response.json()
            if data['success']:
                return data['data']
        except Exception as e:
            print(f"Error fetching live matches: {e}")
        return []

    def get_upcoming_matches(self, limit=10):
        """Get upcoming scheduled matches"""
        try:
            response = requests.get(f'{API_BASE}/matches/upcoming', timeout=10)
            data = response.json()
            if data['success']:
                return data['data'][:limit]
        except Exception as e:
            print(f"Error fetching upcoming matches: {e}")
        return []

    def get_recent_results(self, limit=10):
        """Get recent match results"""
        try:
            response = requests.get(f'{API_BASE}/matches/results', timeout=10)
            data = response.json()
            if data['success']:
                return data['data'][:limit]
        except Exception as e:
            print(f"Error fetching results: {e}")
        return []

    def get_top_players(self, region='na', timespan='60', limit=10):
        """Get top players by rating"""
        try:
            response = requests.get(f'{API_BASE}/players/stats', params={
                'region': region,
                'timespan': timespan,
                'min_rounds': 100
            }, timeout=10)
            data = response.json()
            if data['success']:
                return data['data'][:limit]
        except Exception as e:
            print(f"Error fetching top players: {e}")
        return []

    def get_team_rankings(self, region='na', limit=10):
        """Get team rankings for a region"""
        try:
            response = requests.get(f'{API_BASE}/teams/rankings/{region}', timeout=10)
            data = response.json()
            if data['success']:
                return data['data'][:limit]
        except Exception as e:
            print(f"Error fetching team rankings: {e}")
        return []

    def get_ongoing_events(self):
        """Get ongoing events"""
        try:
            response = requests.get(f'{API_BASE}/events', params={'status': 'ongoing'}, timeout=10)
            data = response.json()
            if data['success']:
                return data['data']
        except Exception as e:
            print(f"Error fetching events: {e}")
        return []

    def get_match_details(self, match_id):
        """Get detailed match info with player stats"""
        try:
            response = requests.get(f'{API_BASE}/matches/{match_id}', timeout=10)
            data = response.json()
            if data['success']:
                return data['data']
        except Exception as e:
            print(f"Error fetching match {match_id}: {e}")
        return None

    def get_player_profile(self, player_id):
        """Get player profile"""
        try:
            response = requests.get(f'{API_BASE}/players/{player_id}', timeout=10)
            data = response.json()
            if data['success']:
                return data['data']
        except Exception as e:
            print(f"Error fetching player {player_id}: {e}")
        return None

    def get_team_profile(self, team_id):
        """Get team profile with roster"""
        try:
            response = requests.get(f'{API_BASE}/teams/{team_id}', timeout=10)
            data = response.json()
            if data['success']:
                return data['data']
        except Exception as e:
            print(f"Error fetching team {team_id}: {e}")
        return None


def print_dashboard(data):
    """Print dashboard data in a nice format"""

    # Live Matches
    print("=" * 60)
    print("  LIVE MATCHES")
    print("=" * 60)
    if data['live_matches']:
        for match in data['live_matches']:
            t1 = match['team1']
            t2 = match['team2']
            score1 = t1.get('score', '-')
            score2 = t2.get('score', '-')
            print(f"  {t1['name']} [{score1}] vs [{score2}] {t2['name']}")
            print(f"    Event: {match.get('event', 'N/A')}")
    else:
        print("  No live matches")

    # Upcoming Matches
    print("\n" + "=" * 60)
    print("  UPCOMING MATCHES")
    print("=" * 60)
    for match in data['upcoming_matches']:
        t1 = match['team1']
        t2 = match['team2']
        eta = match.get('eta', match.get('matchTime', 'TBD'))
        print(f"  {t1['name']} vs {t2['name']} - {eta}")

    # Recent Results
    print("\n" + "=" * 60)
    print("  RECENT RESULTS")
    print("=" * 60)
    for match in data['recent_results']:
        t1 = match['team1']
        t2 = match['team2']
        score1 = t1.get('score', '-')
        score2 = t2.get('score', '-')
        print(f"  {t1['name']} {score1} - {score2} {t2['name']}")

    # Top Players
    print("\n" + "=" * 60)
    print("  TOP PLAYERS (NA - Last 60 Days)")
    print("=" * 60)
    for i, entry in enumerate(data['top_players'], 1):
        player = entry['player']
        stats = entry['stats']
        agents = ', '.join(entry.get('agents', [])[:2])
        print(f"  {i:2}. {player['name']:15} | Rating: {stats['rating']:.2f} | ACS: {stats['acs']:.0f} | Agents: {agents}")

    # Ongoing Events
    print("\n" + "=" * 60)
    print("  ONGOING EVENTS")
    print("=" * 60)
    for event in data['ongoing_events'][:5]:
        print(f"  {event['name']}")
        print(f"    Dates: {event.get('dates', 'TBD')} | Prize: {event.get('prizePool', 'TBD')}")

    print("\n" + "=" * 60)
    print(f"  Last updated: {data['fetched_at']}")
    print("=" * 60)


# For a web framework like Flask/FastAPI, you'd return JSON:
def get_dashboard_json():
    """Return dashboard data as JSON (for web APIs)"""
    dashboard = VLRDashboard()
    return dashboard.fetch_all()


# Example: React/Next.js would fetch this endpoint
# fetch('http://your-backend/dashboard').then(r => r.json())


if __name__ == '__main__':
    # Create dashboard and fetch data
    dashboard = VLRDashboard()
    data = dashboard.fetch_all()

    # Print formatted dashboard
    print_dashboard(data)

    # Example: Get details for a specific live match
    if data['live_matches']:
        match_id = data['live_matches'][0]['id']
        print(f"\n\nFetching details for live match {match_id}...")
        details = dashboard.get_match_details(match_id)
        if details and details.get('maps'):
            print(f"\nMatch: {details['team1']['name']} vs {details['team2']['name']}")
            for map_data in details['maps']:
                print(f"\n  Map: {map_data['map']} ({map_data['team1Score']}-{map_data['team2Score']})")
                print(f"  {'Player':<15} {'Agent':<10} {'K/D/A':<12} {'ACS':<6} {'ADR':<6}")
                print("  " + "-" * 50)
                for p in map_data.get('team1Players', [])[:5]:
                    kda = f"{p.get('kills', 0)}/{p.get('deaths', 0)}/{p.get('assists', 0)}"
                    print(f"  {p.get('agent', 'N/A'):<15} {'':<10} {kda:<12} {p.get('acs', 0):<6} {p.get('adr', 0):<6}")
