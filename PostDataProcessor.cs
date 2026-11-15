
using System.Text.Json;

public static class PostDataProcessor
{
    public static List<JsonElement> GetRecentPosts(
        IEnumerable<JsonElement> allPosts,
        string page,
        int limit)
    {
        // 1. ตรวจสอบข้อมูลเบื้องต้น
        if (string.IsNullOrWhiteSpace(page))
        {
            throw new ArgumentException(
                "Page name is required.", nameof(page));
        }

        if (limit < 1 || limit > 100)
        {
            throw new ArgumentOutOfRangeException(
                nameof(limit), "Limit must be between 1 and 100.");
        }

        // 2. กรองเฉพาะโพสต์ของเพจที่ต้องการ
        var pagePosts = allPosts
            .Where(post => IsFromPage(post, page));

        // 3. ตัดโพสต์ซ้ำด้วย postId
        // หากไม่มี postId จะลองใช้ URL แทน
        var uniquePosts = pagePosts
            .GroupBy(GetPostKey, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First());

        // 4. เรียงเวลาใหม่ไปเก่า
        var sortedPosts = uniquePosts
            .OrderByDescending(GetTimestamp)
            .ThenBy(post => GetPostKey(post))
            .Take(limit)
            .ToList();

        return sortedPosts;
    }

    private static bool IsFromPage(
        JsonElement post,
        string requestedPage)
    {
        if (!post.TryGetProperty("pageName", out var pageName))
        {
            return false;
        }

        if (pageName.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        return string.Equals(
            pageName.GetString()?.Trim(),
            requestedPage.Trim(),
            StringComparison.OrdinalIgnoreCase);
    }

    private static string GetPostKey(JsonElement post)
    {
        if (post.TryGetProperty("postId", out var postId))
        {
            var id = postId.ToString();

            if (!string.IsNullOrWhiteSpace(id))
            {
                return "id:" + id;
            }
        }

        foreach (var property in new[] { "facebookUrl", "url" })
        {
            if (post.TryGetProperty(property, out var url))
            {
                var value = url.GetString();

                if (!string.IsNullOrWhiteSpace(value))
                {
                    return "url:" + value.Trim().TrimEnd('/');
                }
            }
        }

        // โพสต์ที่ไม่มีทั้ง ID และ URL
        // ไม่ควรถูกรวมเป็นโพสต์เดียวกันโดยไม่ตั้งใจ
        return "unknown:" + post.GetRawText();
    }

    private static long GetTimestamp(JsonElement post)
    {
        if (post.TryGetProperty("timestamp", out var timestamp))
        {
            if (timestamp.ValueKind == JsonValueKind.Number &&
                timestamp.TryGetInt64(out var value))
            {
                return value;
            }

            if (timestamp.ValueKind == JsonValueKind.String &&
                long.TryParse(timestamp.GetString(), out value))
            {
                return value;
            }
        }

        // ถ้าไม่มี timestamp ที่อ่านได้
        // ให้ไปอยู่ท้ายรายการ
        return long.MinValue;
    }
}