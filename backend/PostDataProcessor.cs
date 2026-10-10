
using System.Text.Json;

public static class PostDataProcessor
{
    public static List<JsonElement> GetRecentPosts(
        IEnumerable<JsonElement> allPosts,
        string page,
        int limit)
    {
        // 1. α╕òα╕úα╕ºα╕êα╕¬α╕¡α╕Üα╕éα╣ëα╕¡α╕íα╕╣α╕Ñα╣Çα╕Üα╕╖α╣ëα╕¡α╕çα╕òα╣ëα╕Ö
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

        // 2. α╕üα╕úα╕¡α╕çα╣Çα╕ëα╕₧α╕▓α╕░α╣éα╕₧α╕¬α╕òα╣îα╕éα╕¡α╕çα╣Çα╕₧α╕êα╕ùα╕╡α╣êα╕òα╣ëα╕¡α╕çα╕üα╕▓α╕ú
        var pagePosts = allPosts
            .Where(post => IsFromPage(post, page));

        // 3. α╕òα╕▒α╕öα╣éα╕₧α╕¬α╕òα╣îα╕ïα╣ëα╕│α╕öα╣ëα╕ºα╕ó postId
        // α╕½α╕▓α╕üα╣äα╕íα╣êα╕íα╕╡ postId α╕êα╕░α╕Ñα╕¡α╕çα╣âα╕èα╣ë URL α╣üα╕ùα╕Ö
        var uniquePosts = pagePosts
            .GroupBy(GetPostKey, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First());

        // 4. α╣Çα╕úα╕╡α╕óα╕çα╣Çα╕ºα╕Ñα╕▓α╣âα╕½α╕íα╣êα╣äα╕¢α╣Çα╕üα╣êα╕▓
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

        // α╣éα╕₧α╕¬α╕òα╣îα╕ùα╕╡α╣êα╣äα╕íα╣êα╕íα╕╡α╕ùα╕▒α╣ëα╕ç ID α╣üα╕Ñα╕░ URL
        // α╣äα╕íα╣êα╕äα╕ºα╕úα╕ûα╕╣α╕üα╕úα╕ºα╕íα╣Çα╕¢α╣çα╕Öα╣éα╕₧α╕¬α╕òα╣îα╣Çα╕öα╕╡α╕óα╕ºα╕üα╕▒α╕Öα╣éα╕öα╕óα╣äα╕íα╣êα╕òα╕▒α╣ëα╕çα╣âα╕ê
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

        // α╕ûα╣ëα╕▓α╣äα╕íα╣êα╕íα╕╡ timestamp α╕ùα╕╡α╣êα╕¡α╣êα╕▓α╕Öα╣äα╕öα╣ë
        // α╣âα╕½α╣ëα╣äα╕¢α╕¡α╕óα╕╣α╣êα╕ùα╣ëα╕▓α╕óα╕úα╕▓α╕óα╕üα╕▓α╕ú
        return long.MinValue;
    }
}
