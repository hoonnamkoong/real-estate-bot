import requests
import json

def test():
    print("Fetching Mobile clusterList (Pungnap-dong)...")
    url_cluster = 'https://m.land.naver.com/cluster/clusterList?view=atcl&cortarNo=1171010300&rletTpCd=APT&tradTpCd=A1&z=16&lat=37.5340804&lon=127.1179437'
    headers = {'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6)'}
    
    r = requests.get(url_cluster, headers=headers)
    if r.status_code != 200:
        print("Failed to get clusterList:", r.status_code)
        return
    
    data = r.json().get('data', {}).get('ARTICLE', [])
    print(f"Found {len(data)} clusters.")
    
    for cluster in data:
        # Check if it's a specific complex (lgeoNm exists and contains complex name)
        itemId = cluster.get('lgeo')
        name = cluster.get('lgeoNm', 'Unknown')
        count = cluster.get('count', 0)
        
        print(f"\nCluster: {name} (ID: {itemId}), Total articles: {count}")
        
        # Test with rom=4
        url_article = f"https://m.land.naver.com/cluster/ajax/articleList?itemId={itemId}&lgeo=1171010300&rletTpCd=APT&tradTpCd=A1&z=16&lat={cluster['lat']}&lon={cluster['lon']}&totCnt={count}&rom=4"
        r_art = requests.get(url_article, headers=headers)
        if r_art.status_code == 200:
            art_data = r_art.json()
            body = art_data.get('body', [])
            print(f"  -> Mobile API rom=4 returned {len(body)} articles.")
            if len(body) > 0:
                print(f"  -> Sample: {body[0].get('atclNm')} - {body[0].get('spc2')} / {body[0].get('prcInfo')} / {body[0].get('atclFetrDesc')}")
                # We found a complex that successfully returns rom=4 articles on mobile API!
                break
        else:
            print("  -> Failed to fetch articles:", r_art.status_code)

if __name__ == "__main__":
    test()
