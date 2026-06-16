using System.Globalization;
using System.Text.RegularExpressions;

namespace PatrolDeviceAdapter.Services;

public static class RecordsFileParser
{
    private static readonly Regex InformationPattern = new(@"^\((.*)\)$", RegexOptions.Compiled);

    public static IReadOnlyList<Dictionary<string, object?>> ParseFile(string filename)
    {
        if (string.IsNullOrWhiteSpace(filename) || !File.Exists(filename))
        {
            return Array.Empty<Dictionary<string, object?>>();
        }

        var records = new List<Dictionary<string, object?>>();
        foreach (var rawLine in File.ReadAllLines(filename))
        {
            var line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var parsed = ParseLine(line);
            if (parsed is not null)
            {
                records.Add(parsed);
            }
        }

        return records;
    }

    internal static Dictionary<string, object?>? ParseLine(string line)
    {
        var fields = line.Split('\t');
        if (fields.Length < 4)
        {
            return null;
        }

        if (!int.TryParse(fields[0], out var recordTypeCode))
        {
            return null;
        }

        var guardCardNumber = fields[2].Trim();
        var checkpointCode = fields[3].Trim();
        var occurredAt = ParseDeviceDateTimeHex(fields.Length > 9 ? fields[9] : string.Empty)
            ?? DateTime.UtcNow;

        decimal? latitude = TryParseDecimal(fields, 4);
        decimal? longitude = TryParseDecimal(fields, 5);
        decimal? speed = TryParseDecimal(fields, 6);
        int? satellites = fields.Length > 8 && int.TryParse(fields[8], out var parsedSatellites) ? parsedSatellites : null;
        var information = fields.Length > 10 ? ParseInformation(fields[10]) : string.Empty;

        var recordType = MapRecordType(recordTypeCode, latitude, longitude);
        var sourceRecordId = $"{recordTypeCode}:{guardCardNumber}:{checkpointCode}:{occurredAt:O}";

        return new Dictionary<string, object?>
        {
            ["source_record_id"] = sourceRecordId,
            ["guard_card_number"] = guardCardNumber,
            ["checkpoint_code"] = checkpointCode,
            ["occurred_at"] = occurredAt.ToString("o"),
            ["record_type"] = recordType,
            ["information"] = information,
            ["latitude"] = latitude?.ToString(CultureInfo.InvariantCulture),
            ["longitude"] = longitude?.ToString(CultureInfo.InvariantCulture),
            ["speed"] = speed?.ToString(CultureInfo.InvariantCulture),
            ["satellites"] = satellites,
            ["raw_payload"] = new Dictionary<string, object?>
            {
                ["usb_export_line"] = line,
                ["record_type_code"] = recordTypeCode,
            },
        };
    }

    private static string MapRecordType(int recordTypeCode, decimal? latitude, decimal? longitude)
    {
        if (latitude is not null && longitude is not null && (latitude != 0 || longitude != 0))
        {
            return recordTypeCode switch
            {
                2 => "GPSCheckPoint",
                _ => "GPSPosition",
            };
        }

        return recordTypeCode switch
        {
            2 => "normal",
            _ => $"type_{recordTypeCode}",
        };
    }

    private static decimal? TryParseDecimal(string[] fields, int index)
    {
        if (fields.Length <= index)
        {
            return null;
        }

        return decimal.TryParse(fields[index], NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed)
            ? parsed
            : null;
    }

    private static string ParseInformation(string value)
    {
        var match = InformationPattern.Match(value.Trim());
        return match.Success ? match.Groups[1].Value : value.Trim();
    }

    private static DateTime? ParseDeviceDateTimeHex(string hex)
    {
        if (string.IsNullOrWhiteSpace(hex))
        {
            return null;
        }

        try
        {
            var normalized = hex.Trim();
            if (normalized.Length % 2 != 0)
            {
                normalized = normalized.PadLeft(normalized.Length + 1, '0');
            }

            var bytes = Convert.FromHexString(normalized);
            if (bytes.Length < 6)
            {
                return null;
            }

            var year = 2000 + bytes[0];
            var month = bytes[1];
            var day = bytes[2];
            var hour = bytes[3];
            var minute = bytes[4];
            var second = bytes[5];
            return new DateTime(year, month, day, hour, minute, second, DateTimeKind.Local).ToUniversalTime();
        }
        catch (ArgumentException)
        {
            return null;
        }
        catch (FormatException)
        {
            return null;
        }
    }
}
