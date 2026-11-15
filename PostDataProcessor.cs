using System.Text.Json;

public static class PostDataProcessor
{
    // ==============================
    // Facebook: Get Recent Posts
    // ==============================
    public static List<JsonElement> GetRecentPosts(
        IEnumerable<JsonElement> allPosts,
        string page,
        int limit)
    {
        if (string.IsNullOrWhiteSpace(page))
            throw new ArgumentException("Page is required.", nameof(page));

        if (limit < 1 || limit > 100)
            throw new ArgumentOutOfRangeException(nameof(limit));

        var pagePosts = allPosts.Where(post => IsFromPage(post, page));

        var uniquePosts = pagePosts
            .GroupBy(GetPostKey, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First());

        var sortedPosts = uniquePosts
            .OrderByDescending(GetTimestamp)
            .ThenBy(post => GetPostKey(post))
            .Take(limit)
            .ToList();

        return sortedPosts;
    }

    // ==============================
    // Instagram: Get Recent Posts
    // ==============================
    public static List<JsonElement> GetRecentInstagramPosts(
        IEnumerable<JsonElement> allPosts,
        string profile,
        int limit)
    {
        if (string.IsNullOrWhiteSpace(profile))
            throw new ArgumentException("Profile is required.", nameof(profile));

        if (limit < 1 || limit > 100)
            throw new ArgumentOutOfRangeException(nameof(limit));

        var profilePosts = allPosts.Where(post =>
            post.TryGetProperty("ownerUsername", out var username) &&
            username.ValueKind == JsonValueKind.String &&
            string.Equals(
                username.GetString(),
                profile,
                StringComparison.OrdinalIgnoreCase));

        var uniquePosts = profilePosts
            .GroupBy(post =>
            {
                if (post.TryGetProperty("id", out var id))
                    return id.ToString();

                if (post.TryGetProperty("url", out var url))
                    return url.ToString();

                return string.Empty;
            })
            .Select(group => group.First());

        var sortedPosts = uniquePosts
            .OrderByDescending(post =>
            {
                if (post.TryGetProperty("timestamp", out var timestamp) &&
                    DateTimeOffset.TryParse(timestamp.ToString(), out var date))
                {
                    return date;
                }

                return DateTimeOffset.MinValue;
            })
            .Take(limit)
            .ToList();

        return sortedPosts;
    }


    // ==============================
    // TikTok: Get Recent Posts
    // ==============================
   
public static List<JsonElement> GetRecentTikTokPosts(
    IEnumerable<JsonElement> allPosts,
    string profile,
    int limit)
{
    if (string.IsNullOrWhiteSpace(profile))
        throw new ArgumentException("Profile is required.", nameof(profile));

    if (limit < 1 || limit > 100)
        throw new ArgumentOutOfRangeException(nameof(limit));

    var requestedProfile = profile.Trim().TrimStart('@');

    // กรองโพสต์จาก authorMeta.name
    var profilePosts = allPosts.Where(post =>
    {
        if (!post.TryGetProperty("authorMeta", out var authorMeta))
            return false;

        if (authorMeta.ValueKind != JsonValueKind.Object)
            return false;

        if (!authorMeta.TryGetProperty("name", out var username))
            return false;

        return string.Equals(
            username.GetString()?.Trim(),
            requestedProfile,
            StringComparison.OrdinalIgnoreCase);
    });

    // ตัดโพสต์ซ้ำโดยใช้ ID
    var uniquePosts = profilePosts
        .GroupBy(post =>
        {
            if (post.TryGetProperty("id", out var id))
                return id.ToString();

            if (post.TryGetProperty("webVideoUrl", out var url))
                return url.ToString();

            return post.GetRawText();
        })
        .Select(group => group.First());

    // เรียงโพสต์จากใหม่ไปเก่า
    var sortedPosts = uniquePosts
        .OrderByDescending(post =>
        {
            if (post.TryGetProperty("createTimeISO", out var timestamp) &&
                DateTimeOffset.TryParse(
                    timestamp.ToString(),
                    out var date))
            {
                return date;
            }

            return DateTimeOffset.MinValue;
        })
        .Take(limit)
        .ToList();

    return sortedPosts;
}



    // เมธอด IsFromPage เดิมเริ่มต่อจากตรงนี้

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