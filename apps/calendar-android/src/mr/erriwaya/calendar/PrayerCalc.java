package mr.erriwaya.calendar;

/**
 * Prayer times and the Hijri date, computed in the app itself with the same formulas as the page
 * (prayerTimes, sunPos, julian, fmt and civil in web/index-source.html). The adhan alarms and the
 * home-screen widget use it, so both keep working however long the page stays closed.
 * tools/check-prayer-calc.sh compares it with the page's own functions; keep the two in step.
 *
 * Plain Java on purpose (no Android classes): it runs on a desktop JVM for that check.
 * Mauritania is on UTC all year, so a day here is a UTC day and the times are UTC hours.
 */
public final class PrayerCalc {
    private PrayerCalc() { }

    public static final int FAJR = 0, SUNRISE = 1, DHUHR = 2, ASR = 3, MAGHRIB = 4, ISHA = 5;
    public static final long DAY = 86400000L;

    private static final double R = Math.PI / 180;
    private static double sin(double d) { return Math.sin(d * R); }
    private static double cos(double d) { return Math.cos(d * R); }
    private static double tan(double d) { return Math.tan(d * R); }
    private static double asin(double x) { return Math.asin(x) / R; }
    private static double acos(double x) { return Math.acos(x) / R; }
    private static double atan2(double y, double x) { return Math.atan2(y, x) / R; }
    private static double acot(double x) { return Math.atan(1 / x) / R; }
    static double fix(double a, double b) { a -= b * Math.floor(a / b); return a < 0 ? a + b : a; }

    /** Floor division (Math.floorDiv is missing before Android 7). */
    static long fd(long a, long b) { long q = a / b; return (a % b != 0 && ((a ^ b) < 0)) ? q - 1 : q; }

    private static double julian(int y, int m, int d) {
        if (m <= 2) { y -= 1; m += 12; }
        double a = Math.floor(y / 100.0), b = 2 - a + Math.floor(a / 4);
        return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
    }

    /** {declination, equation of time} */
    private static double[] sunPos(double jd) {
        double D = jd - 2451545, g = fix(357.529 + .98560028 * D, 360), q = fix(280.459 + .98564736 * D, 360),
                L = fix(q + 1.915 * sin(g) + .02 * sin(2 * g), 360), e = 23.439 - .00000036 * D,
                RA = fix(atan2(cos(e) * sin(L), cos(L)) / 15, 24);
        return new double[]{asin(sin(e) * sin(L)), q / 15 - RA};
    }

    private static double mid(double jd0, double t) { return fix(12 - sunPos(jd0 + t)[1], 24); }

    private static double ang(double jd0, double lat, double a, double t, boolean ccw) {
        double dc = sunPos(jd0 + t)[0], n = mid(jd0, t),
                T = acos((-sin(a) - sin(dc) * sin(lat)) / (cos(dc) * cos(lat))) / 15;
        return n + (ccw ? -T : T);
    }

    /**
     * The day's times in hours (UTC): fajr, sunrise, dhuhr, asr, maghrib, isha.
     * ishaMin > 0 means isha is that many minutes after maghrib (Umm al-Qura) and ishaAngle is ignored;
     * asrFactor is 1 (the majority, Maliki) or 2 (Hanafi).
     */
    public static double[] times(int y, int m, int d, double lat, double lng,
                                 double fajrAngle, double ishaAngle, int ishaMin, double asrFactor) {
        double jd0 = julian(y, m, d) - lng / (15 * 24);
        double fajr = 5, sunrise = 6, dhuhr = 12, asr = 13, sunset = 18, isha = 18;
        for (int i = 0; i < 2; i++) {
            double f = ang(jd0, lat, fajrAngle, fajr / 24, true);
            double sr = ang(jd0, lat, .833, sunrise / 24, true);
            double dh = mid(jd0, dhuhr / 24);
            double dcA = sunPos(jd0 + asr / 24)[0];
            double as = ang(jd0, lat, -acot(asrFactor + tan(Math.abs(lat - dcA))), asr / 24, false);
            double ss = ang(jd0, lat, .833, sunset / 24, false);
            double is = ishaMin > 0 ? 0 : ang(jd0, lat, ishaAngle, isha / 24, false);
            fajr = f; sunrise = sr; dhuhr = dh; asr = as; sunset = ss; isha = is;
        }
        double off = -lng / 15;
        return new double[]{fajr + off, sunrise + off, dhuhr + off, asr + off, sunset + off,
                ishaMin > 0 ? sunset + off + ishaMin / 60.0 : isha + off};
    }

    /** Minutes after midnight, rounded as the page shows the time; -1 when the time does not exist. */
    public static int minutes(double h) {
        if (Double.isNaN(h) || Double.isInfinite(h)) return -1;
        return (int) Math.floor(fix(h + .5 / 60, 24) * 60);
    }

    public static String fmt(double h) {
        int mins = minutes(h);
        if (mins < 0) return "--:--";
        return (mins / 60 < 10 ? "0" : "") + (mins / 60) + ":" + (mins % 60 < 10 ? "0" : "") + (mins % 60);
    }

    /** {year, month, day} of a UTC day counted from 1970-01-01. */
    public static int[] gregorian(long epochDay) {
        long z = epochDay + 719468, era = fd(z, 146097L), doe = z - era * 146097,
                yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365, y = yoe + era * 400,
                doy = doe - (365 * yoe + yoe / 4 - yoe / 100), mp = (5 * doy + 2) / 153,
                d = doy - (153 * mp + 2) / 5 + 1, m = mp < 10 ? mp + 3 : mp - 9;
        return new int[]{(int) (m <= 2 ? y + 1 : y), (int) m, (int) d};
    }

    /** The arithmetic (civil) Hijri date of a Julian day number: {year, month, day}. The page's fallback, and Android 6's. */
    public static int[] civil(long jdn) {
        long l = jdn - 1948440 + 10632;
        long n = fd(l - 1, 10631L);
        l = l - 10631 * n + 354;
        long j = fd(10985 - l, 5316L) * fd(50 * l, 17719L) + fd(l, 5670L) * fd(43 * l, 15238L);
        l = l - fd(30 - j, 15L) * fd(17719 * j, 50L) - fd(j, 16L) * fd(15238 * j, 43L) + 29;
        long m = fd(24 * l, 709L), d = l - fd(709 * m, 24L);
        return new int[]{(int) (30 * n + j - 30), (int) m, (int) d};
    }

    /** Prints one line per day and place for tools/check-prayer-calc.sh. */
    public static void main(String[] a) {
        double[][] places = {{18.0858, -15.9785}, {20.931, -17.0347}, {16.6167, -7.25}, {25.24, -11.6}, {15.16, -12.18}};
        double[][] methods = {{18, 17, 0}, {19, 17, 0}, {19.5, 17.5, 0}, {18.5, 0, 90}};
        StringBuilder sb = new StringBuilder();
        for (long day = 20454; day < 20454 + 800; day += 3) {   // 2026-01-01 on, every third day
            int[] g = gregorian(day);
            int[] h = civil(day + 2440588);
            sb.append(g[0]).append('-').append(g[1]).append('-').append(g[2]).append(" h").append(h[0]).append('-').append(h[1]).append('-').append(h[2]);
            for (double[] p : places) for (double[] me : methods) for (int asr = 1; asr <= 2; asr++) {
                double[] t = times(g[0], g[1], g[2], p[0], p[1], me[0], me[1], (int) me[2], asr);
                for (double x : t) sb.append(' ').append(fmt(x));
            }
            sb.append('\n');
        }
        System.out.print(sb);
    }
}
