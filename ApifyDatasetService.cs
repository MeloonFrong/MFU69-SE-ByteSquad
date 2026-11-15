
using System.Text.Json;

public sealed class ApifyDatasetService
{
    private readonly HttpClient _httpClient;
    private readonly string _token;

    public ApifyDatasetService(
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _httpClient = httpClient;

        _token = configuration["Apify:Token"]
            ?? throw new InvalidOperationException(
                "Apify:Token is missing.");
    }

    public async Task<List<string>> GetDatasetIdsAsync(
    CancellationToken cancellationToken = default)
{
    const string url =
        "https://api.apify.com/v2/datasets" +
        "?limit=100&offset=0&desc=1" +
        "&ownership=ownedByMe&unnamed=true";

    using var document = await GetJsonAsync(
        url, cancellationToken);

    var datasets = ExtractItems(document.RootElement);

    return datasets
        .Where(dataset =>
            dataset.TryGetProperty("id", out var id) &&
            id.ValueKind == JsonValueKind.String)
        .Select(dataset => dataset.GetProperty("id").GetString()!)
        .Where(id => !string.IsNullOrWhiteSpace(id))
        .ToList();
}

    public async Task<List<JsonElement>> GetAllPostsAsync(
    CancellationToken cancellationToken = default)
{
    var allPosts = new List<JsonElement>();

    // ดึง Dataset IDs จาก Apify
    var datasetIds = await GetDatasetIdsAsync(
        cancellationToken);

    // อ่านโพสต์จากทุก Dataset
    foreach (var datasetId in datasetIds)
    {
        var posts = await GetDatasetPostsAsync(
            datasetId,
            cancellationToken);

        allPosts.AddRange(posts);
    }

    return allPosts;
}

    private async Task<List<JsonElement>> GetDatasetPostsAsync(
        string datasetId,
        CancellationToken cancellationToken)
    {
        var posts = new List<JsonElement>();
        const int pageSize = 1000;
        var offset = 0;

        while (true)
        {
            var url =
                $"https://api.apify.com/v2/datasets/{datasetId}/items" +
                $"?format=json&limit={pageSize}&offset={offset}";

            using var document = await GetJsonAsync(
                url, cancellationToken);

            var root = document.RootElement;

            if (root.ValueKind != JsonValueKind.Array)
            {
                break;
            }

            var count = 0;

            foreach (var item in root.EnumerateArray())
            {
                posts.Add(item.Clone());
                count++;
            }

            if (count < pageSize)
            {
                break;
            }

            offset += count;
        }

        return posts;
    }

    private async Task<JsonDocument> GetJsonAsync(
        string url,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Get, url);

        request.Headers.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Bearer", _token);

        using var response = await _httpClient.SendAsync(
            request, cancellationToken);

        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(
            cancellationToken);

        return JsonDocument.Parse(json);
    }

    private static List<JsonElement> ExtractItems(
        JsonElement root)
    {
        // รูปแบบ response ที่มี items โดยตรง
        if (root.ValueKind == JsonValueKind.Object &&
            root.TryGetProperty("items", out var items) &&
            items.ValueKind == JsonValueKind.Array)
        {
            return items.EnumerateArray()
                .Select(item => item.Clone())
                .ToList();
        }

        // รูปแบบ Apify API ที่ครอบข้อมูลไว้ใน data
        if (root.ValueKind == JsonValueKind.Object &&
            root.TryGetProperty("data", out var data))
        {
            if (data.ValueKind == JsonValueKind.Array)
            {
                return data.EnumerateArray()
                    .Select(item => item.Clone())
                    .ToList();
            }

            if (data.ValueKind == JsonValueKind.Object &&
                data.TryGetProperty("items", out var dataItems) &&
                dataItems.ValueKind == JsonValueKind.Array)
            {
                return dataItems.EnumerateArray()
                    .Select(item => item.Clone())
                    .ToList();
            }
        }

        return new List<JsonElement>();
    }
}