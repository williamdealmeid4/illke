<?php

namespace App\Support;

use Normalizer;

class FuzzyMatcher
{
    public static function normalize(string $value): string
    {
        $normalized = class_exists(Normalizer::class)
            ? Normalizer::normalize($value, Normalizer::FORM_D)
            : $value;

        $stripped = preg_replace('/\p{Mn}+/u', '', (string) $normalized) ?? (string) $normalized;
        $lower = mb_strtolower($stripped, 'UTF-8');

        return trim((string) preg_replace('/[^a-z0-9]+/', ' ', $lower));
    }

    public static function compact(string $normalized): string
    {
        return str_replace(' ', '', $normalized);
    }

    public static function distance(string $a, string $b): int
    {
        $lenA = strlen($a);
        $lenB = strlen($b);

        if ($lenA === 0) {
            return $lenB;
        }
        if ($lenB === 0) {
            return $lenA;
        }

        $d = [];
        for ($i = 0; $i <= $lenA; $i++) {
            $d[$i] = array_fill(0, $lenB + 1, 0);
            $d[$i][0] = $i;
        }
        for ($j = 0; $j <= $lenB; $j++) {
            $d[0][$j] = $j;
        }

        for ($i = 1; $i <= $lenA; $i++) {
            for ($j = 1; $j <= $lenB; $j++) {
                $cost = $a[$i - 1] === $b[$j - 1] ? 0 : 1;
                $val = min(
                    $d[$i - 1][$j] + 1,
                    $d[$i][$j - 1] + 1,
                    $d[$i - 1][$j - 1] + $cost
                );

                if ($i > 1 && $j > 1 && $a[$i - 1] === $b[$j - 2] && $a[$i - 2] === $b[$j - 1]) {
                    $val = min($val, $d[$i - 2][$j - 2] + $cost);
                }

                $d[$i][$j] = $val;
            }
        }

        return $d[$lenA][$lenB];
    }

    /**
     * @param  iterable<string>  $candidates
     */
    public static function suggest(string $query, iterable $candidates): ?string
    {
        $normQ = self::normalize($query);
        $compactQ = self::compact($normQ);
        $qLen = strlen($compactQ);

        if ($qLen < 3 || ctype_digit($compactQ)) {
            return null;
        }

        $maxDist = match (true) {
            $qLen <= 4 => 1,
            $qLen <= 7 => 2,
            $qLen <= 11 => 3,
            default => min(4, (int) floor($qLen * 0.35)),
        };

        $bestCandidate = null;
        $bestScore = -INF;
        $seen = [];

        foreach ($candidates as $candidate) {
            if (! is_string($candidate) || $candidate === '') {
                continue;
            }

            $normC = self::normalize($candidate);
            $compactC = self::compact($normC);

            if ($compactC === '' || isset($seen[$compactC])) {
                continue;
            }
            $seen[$compactC] = true;

            $cLen = strlen($compactC);
            if (abs($qLen - $cLen) > $maxDist) {
                continue;
            }

            $dist = min(
                self::distance($normQ, $normC),
                self::distance($compactQ, $compactC)
            );

            if ($dist === 0 || $dist > $maxDist) {
                continue;
            }

            $maxLen = max($qLen, $cLen);
            $similarity = 1.0 - ($dist / $maxLen);
            if ($similarity < 0.55) {
                continue;
            }

            $prefixLen = 0;
            $minLen = min($qLen, $cLen);
            while ($prefixLen < $minLen && $compactQ[$prefixLen] === $compactC[$prefixLen]) {
                $prefixLen++;
            }

            $firstCharBonus = $compactQ[0] === $compactC[0] ? 8.0 : 0.0;
            $score = ($similarity * 100.0)
                + $firstCharBonus
                + ($prefixLen * 2.0)
                - (abs($cLen - $qLen) * 0.5)
                - ($cLen * 0.05);

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestCandidate = $candidate;
            }
        }

        return $bestCandidate;
    }
}
