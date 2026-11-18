#!/usr/bin/env python3
"""Forecast map of Mauritania for the «الطقس» screen (calendar app).

Every 6 hours (GitHub Actions, .github/workflows/calendar-wxmap.yml) this asks Open-Meteo for the ECMWF IFS 0.25°
forecast (cloud cover, precipitation, weather code, wind) and the CAMS dust forecast on a 0.5° grid over the
satellite box of the app (13.5–28°N, 18.5–4°W, 30 × 30 points), every 3 hours for 7 days, and writes one compact
file, wxmap.json, that the app downloads (branch calendar-wxmap, force-pushed with a single commit so the history
does not grow). One download per phone instead of hundreds of API calls per phone.

Arrays are base64 of uint8, step-major, rows from north to south, columns from west to east:
  cc  cloud cover %                       pr  precipitation of the next 3 hours, tenths of mm (≤ 25 mm)
  ts  1 when a thunderstorm code (≥ 95) falls in those 3 hours
  ws  wind speed km/h                     wd  wind direction (from) / 2, degrees
  du  dust µg/m³ / 4 (255 = no forecast; CAMS goes 5 days ahead)
Usage: python3 wxmap.py out.json
"""
import base64, datetime, json, sys, time, urllib.request, urllib.parse

N, S, W, E, D = 28.0, 13.5, -18.5, -4.0, 0.5
NY, NX = round((N - S) / D) + 1, round((E - W) / D) + 1
STEP, DAYS = 3, 7
LATS = [round(N - j * D, 2) for j in range(NY)]
LONS = [round(W + i * D, 2) for i in range(NX)]
PTS = [(la, lo) for la in LATS for lo in LONS]


def get(url, tries=4):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'mauritania-calendar-wxmap'}), timeout=120) as r:
                return json.load(r)
        except Exception as e:
            print('retry', k, e, file=sys.stderr)
            time.sleep(5 * (k + 1))
    raise SystemExit('failed: ' + url[:120])


def fetch(base, params, chunk=100):
    out = []
    for a in range(0, len(PTS), chunk):
        part = PTS[a:a + chunk]
        q = dict(params, latitude=','.join(str(p[0]) for p in part), longitude=','.join(str(p[1]) for p in part), timezone='GMT')
        j = get(base + '?' + urllib.parse.urlencode(q))
        out += j if isinstance(j, list) else [j]
        time.sleep(1)
    assert len(out) == len(PTS), (len(out), len(PTS))
    return out


def main(dst):
    fc = fetch('https://api.open-meteo.com/v1/forecast', {
        'hourly': 'cloud_cover,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
        'models': 'ecmwf_ifs025', 'forecast_days': DAYS})
    aq = fetch('https://air-quality-api.open-meteo.com/v1/air-quality', {'hourly': 'dust', 'forecast_days': 5})
    times = fc[0]['hourly']['time']
    ns = len(times) // STEP
    arr = {k: bytearray(ns * len(PTS)) for k in ('cc', 'pr', 'ts', 'ws', 'wd', 'du')}
    aqt = {t: i for i, t in enumerate(aq[0]['hourly']['time'])}
    missing = 0
    for p, (f, a) in enumerate(zip(fc, aq)):
        h, ah = f['hourly'], a['hourly']
        for s in range(ns):
            i, o = s * STEP, s * len(PTS) + p
            v = lambda key, k=i: h[key][k] if k < len(h[key]) else None
            cc = v('cloud_cover')
            if cc is None: missing += 1
            arr['cc'][o] = max(0, min(100, round(cc or 0)))
            pr = sum((h['precipitation'][k] or 0) for k in range(i + 1, min(i + 1 + STEP, len(times))))
            arr['pr'][o] = min(250, round(pr * 10))
            arr['ts'][o] = 1 if any((h['weather_code'][k] or 0) >= 95 for k in range(i, min(i + STEP, len(times)))) else 0
            arr['ws'][o] = min(254, round(v('wind_speed_10m') or 0))
            arr['wd'][o] = round((v('wind_direction_10m') or 0) % 360 / 2)
            k = aqt.get(times[i])
            du = ah['dust'][k] if k is not None and k < len(ah['dust']) else None
            arr['du'][o] = 255 if du is None else min(254, round(du / 4))
    if missing > len(PTS) * ns * 0.2:
        raise SystemExit(f'too many missing values ({missing}); keeping the previous map')
    out = {'v': 1, 'gen': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%MZ'),
           'src': 'ECMWF IFS 0.25° (Open-Meteo) · CAMS', 't0': times[0] + 'Z', 'dt': STEP, 'ns': ns,
           'nx': NX, 'ny': NY, 'n': N, 'w': W, 'd': D}
    out.update({k: base64.b64encode(bytes(b)).decode() for k, b in arr.items()})
    json.dump(out, open(dst, 'w'), separators=(',', ':'))
    print('ok', ns, 'steps', len(PTS), 'points, missing', missing)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'wxmap.json')
