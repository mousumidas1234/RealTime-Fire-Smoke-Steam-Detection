#!/usr/bin/env python3
"""Download sample images for classes from Wikimedia Commons.

Saves images under backend/dataset/images/{train,val,test}/{class}/
Usage: python3 download_wiki_images.py --per-class 30
"""
import argparse
import os
import random
import requests
from urllib.parse import unquote

API = "https://commons.wikimedia.org/w/api.php"
HEADERS = {"User-Agent": "iocl-cv-detection/0.1 (contact: please-replace@example.com)"}


def search_images(query, limit=30):
    params = {
        'action': 'query',
        'format': 'json',
        'generator': 'search',
        'gsrsearch': query,
        'gsrlimit': str(limit),
        'prop': 'imageinfo',
        'iiprop': 'url',
    }
    r = requests.get(API, params=params, timeout=30, headers=HEADERS)
    r.raise_for_status()
    data = r.json()
    pages = data.get('query', {}).get('pages', {})
    urls = []
    for p in pages.values():
        ii = p.get('imageinfo')
        if ii and isinstance(ii, list):
            url = ii[0].get('url')
            if url and url.startswith('http'):
                urls.append(url)
    return urls


def download(url, dest):
    try:
        r = requests.get(url, stream=True, timeout=30, headers=HEADERS)
        r.raise_for_status()
        with open(dest, 'wb') as f:
            for chunk in r.iter_content(8192):
                f.write(chunk)
        return True
    except Exception:
        return False


def category_images(category, limit=50):
    params = {
        'action': 'query',
        'format': 'json',
        'list': 'categorymembers',
        'cmtitle': f'Category:{category}',
        'cmtype': 'file',
        'cmlimit': str(limit),
    }
    r = requests.get(API, params=params, timeout=30, headers=HEADERS)
    r.raise_for_status()
    data = r.json()
    members = data.get('query', {}).get('categorymembers', [])
    titles = [m.get('title') for m in members if m.get('title')]
    urls = []
    # fetch imageinfo in batches
    for i in range(0, len(titles), 50):
        batch = titles[i:i+50]
        params = {
            'action': 'query',
            'format': 'json',
            'prop': 'imageinfo',
            'titles': '|'.join(batch),
            'iiprop': 'url',
        }
        r = requests.get(API, params=params, timeout=30, headers=HEADERS)
        r.raise_for_status()
        pages = r.json().get('query', {}).get('pages', {})
        for p in pages.values():
            ii = p.get('imageinfo')
            if ii and isinstance(ii, list):
                url = ii[0].get('url')
                if url:
                    urls.append(url)
    return urls


def ensure_dirs(base, classes):
    for split in ('train', 'val', 'test'):
        for c in classes:
            d = os.path.join(base, split, c)
            os.makedirs(d, exist_ok=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--per-class', type=int, default=30)
    parser.add_argument('--out', default='../dataset/images')
    args = parser.parse_args()

    classes = ['fire', 'smoke', 'steam']
    base = os.path.join(os.path.dirname(__file__), args.out)
    ensure_dirs(base, classes)

    # Use Unsplash source to fetch sample images by keyword (no API key required)
    # First try Wikimedia Commons categories
    category_map = {'fire': 'Fire', 'smoke': 'Smoke', 'steam': 'Steam'}
    for cls in classes:
        print(f'Downloading for class: {cls} (Wikimedia category)')
        urls = category_images(category_map.get(cls, cls.capitalize()), limit=args.per_class * 2)
        random.shuffle(urls)
        count = 0
        for url in urls:
            if count >= args.per_class:
                break
            ext = os.path.splitext(unquote(url).split('?')[0])[1]
            if ext.lower() not in ('.jpg', '.jpeg', '.png', '.gif'):
                ext = '.jpg'
            name = f'{cls}_{count}{ext}'
            rnum = random.random()
            if rnum < 0.7:
                split = 'train'
            elif rnum < 0.85:
                split = 'val'
            else:
                split = 'test'
            dest = os.path.join(base, split, cls, name)
            ok = download(url, dest)
            if ok:
                count += 1
                print(f'  saved {dest}')
        print(f'Collected {count} images for {cls}\n')


if __name__ == '__main__':
    main()
