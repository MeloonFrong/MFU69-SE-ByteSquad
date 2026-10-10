using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// α╣Çα╕òα╕úα╕╡α╕óα╕íα╣Çα╕äα╕úα╕╖α╣êα╕¡α╕çα╕íα╕╖α╕¡α╕¬α╕│α╕½α╕úα╕▒α╕Üα╕¬α╣êα╕ç HTTP Request
builder.Services.AddHttpClient();
builder.Services.AddHttpClient<ApifyDatasetService>();

builder.Services.AddSingleton<SourceStore>();

var app = builder.Build();

// Endpoint α╕¬α╕│α╕½α╕úα╕▒α╕Üα╕òα╕úα╕ºα╕êα╕¬α╕¡α╕Üα╕ºα╣êα╕▓ Backend α╕ùα╕│α╕çα╕▓α╕Öα╕½α╕úα╕╖α╕¡α╣äα╕íα╣ê
app.MapGet("/", () => "Apify Dataset Reader is running!");
app.MapGet("/api/sources", async (SourceStore store) =>
{
    var sources = await store.GetAllAsync();

    return Results.Ok(new { sources });
});

app.MapPost("/api/sources", async (
    JsonElement source,
    SourceStore store) =>
{
    if (source.ValueKind != JsonValueKind.Object)
    {
        return Results.BadRequest(new
        {
            error = "Source must be a JSON object."
        });
    }

    if (!source.TryGetProperty("id", out var id) ||
        string.IsNullOrWhiteSpace(id.ToString()))
    {
        return Results.BadRequest(new
        {
            error = "Source ID is required."
        });
    }

    await store.AddAsync(source);

    return Results.Ok(new
    {
        success = true,
        id = id.ToString()
    });
});
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "ok",
    backend = "csharp"
}));


// Get items from a selected dataset
app.MapGet("/api/datasets/{datasetId}/items", async (
    string datasetId,
    int limit,
    int offset,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration) =>
{
    var token = configuration["Apify:Token"];

    if (string.IsNullOrWhiteSpace(token))
    {
        return Results.Problem(
            "Apify Token is missing.",
            statusCode: 500);
    }

    if (string.IsNullOrWhiteSpace(datasetId) ||
        limit < 1 || limit > 100 ||
        offset < 0)
    {
        return Results.BadRequest(new
        {
            error = "A datasetId is required. limit must be 1-100 and offset must be >= 0."
        });
    }

    var safeDatasetId = Uri.EscapeDataString(datasetId);

    var url =
        $"https://api.apify.com/v2/datasets/" +
        $"{safeDatasetId}/items" +
        $"?format=json&limit={limit}&offset={offset}";

    var client = httpClientFactory.CreateClient();
    client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", token);

    try
    {
        var response = await client.GetAsync(url);

        if (!response.IsSuccessStatusCode)
        {
            return Results.Problem(
                $"Apify returned HTTP {(int)response.StatusCode}.",
                statusCode: 502);
        }

        var json = await response.Content.ReadAsStringAsync();

        return Results.Content(json, "application/json");
    }
    catch (HttpRequestException)
    {
        return Results.Problem(
            "Unable to connect to Apify.",
            statusCode: 502);
    }
});

// Get datasets owned by your Apify account
app.MapGet("/api/datasets", async (
    int limit,
    int offset,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration) =>
{
    var token = configuration["Apify:Token"];

    if (string.IsNullOrWhiteSpace(token))
    {
        return Results.Problem(
            "Apify Token is missing.",
            statusCode: 500);
    }

    if (limit < 1 || limit > 1000 || offset < 0)
    {
        return Results.BadRequest(new
        {
            error = "limit must be 1-1000 and offset must be >= 0."
        });
    }

    var url =
        $"https://api.apify.com/v2/datasets" +
        $"?limit={limit}&offset={offset}&desc=1" +
        $"&ownership=ownedByMe&unnamed=true";

    var client = httpClientFactory.CreateClient();
    client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", token);

    try
    {
        var response = await client.GetAsync(url);

        if (!response.IsSuccessStatusCode)
        {
            return Results.Problem(
                $"Apify returned HTTP {(int)response.StatusCode}.",
                statusCode: 502);
        }

        var json = await response.Content.ReadAsStringAsync();

        return Results.Content(json, "application/json");
    }
    catch (HttpRequestException)
    {
        return Results.Problem(
            "Unable to connect to Apify.",
            statusCode: 502);
    }
});


app.MapPost("/api/actors/facebook-posts-scraper/run", async (
    JsonElement input,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration) =>
{
    var token = configuration["Apify:Token"];

    if (string.IsNullOrWhiteSpace(token))
    {
        return Results.Problem(
            "Apify Token is missing.",
            statusCode: 500);
    }

    if (input.ValueKind != JsonValueKind.Object)
    {
        return Results.BadRequest(new
        {
            error = "Request body must be a JSON object."
        });
    }

    var url =
        "https://api.apify.com/v2/acts/" +
        "apify~facebook-posts-scraper/" +
        "run-sync-get-dataset-items" +
        "?format=json";

    var client = httpClientFactory.CreateClient();
    client.Timeout = TimeSpan.FromMinutes(5);

    using var request = new HttpRequestMessage(
        HttpMethod.Post, url);

    request.Headers.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue(
            "Bearer", token);

    request.Content = new StringContent(
        input.GetRawText(),
        Encoding.UTF8,
        "application/json");

    try
    {
        using var response = await client.SendAsync(request);
        var json = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            return Results.Problem(
                $"Apify returned HTTP {(int)response.StatusCode}: {json}",
                statusCode: 502);
        }

        return Results.Content(
            json,
            "application/json");
    }
    catch (TaskCanceledException)
    {
        return Results.Problem(
            "The Actor request timed out.",
            statusCode: 504);
    }
    catch (HttpRequestException)
    {
        return Results.Problem(
            "Unable to connect to Apify.",
            statusCode: 502);
    }
});


app.MapGet("/api/posts/recent", async (
    string? page,
    int? limit,
    ApifyDatasetService datasetService,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(page))
    {
        return Results.BadRequest(new
        {
            error = "Please provide a page name.",
            example = "/api/posts/recent?page=MFU2Connect&limit=10"
        });
    }

    var requestedLimit = limit ?? 10;

    if (requestedLimit < 1 || requestedLimit > 100)
    {
        return Results.BadRequest(new
        {
            error = "Limit must be between 1 and 100."
        });
    }

    try
    {
        // α╕¡α╣êα╕▓α╕Öα╣éα╕₧α╕¬α╕òα╣îα╕êα╕▓α╕üα╕ùα╕╕α╕ü Datasets
        var allPosts = await datasetService.GetAllPostsAsync(
            cancellationToken);

        // α╕òα╕▒α╕öα╕ïα╣ëα╕│ α╣Çα╕úα╕╡α╕óα╕çα╣Çα╕ºα╕Ñα╕▓ α╣üα╕Ñα╕░α╣Çα╕Ñα╕╖α╕¡α╕üα╕êα╕│α╕Öα╕ºα╕Öα╕ùα╕╡α╣êα╕òα╣ëα╕¡α╕çα╕üα╕▓α╕ú
        var recentPosts = PostDataProcessor.GetRecentPosts(
            allPosts,
            page,
            requestedLimit);

        return Results.Ok(new
        {
            page,
            requestedLimit,
            totalScanned = allPosts.Count,
            returned = recentPosts.Count,
            posts = recentPosts
        });
    }
    catch (OperationCanceledException)
        when (cancellationToken.IsCancellationRequested)
    {
        throw;
    }
    catch (OperationCanceledException)
    {
        return Results.Problem(
            "The request to Apify timed out.",
            statusCode: 504);
    }
    catch (HttpRequestException)
    {
        return Results.Problem(
            "Unable to retrieve datasets from Apify. " +
            "Check your Apify token and API access.",
            statusCode: 502);
    }
    catch (InvalidOperationException ex)
    {
        return Results.Problem(
            ex.Message,
            statusCode: 500);
    }
});

app.MapGet("/api/debug/datasets", async (
    ApifyDatasetService service,
    CancellationToken cancellationToken) =>
{
    var ids = await service.GetDatasetIdsAsync(
        cancellationToken);

    return Results.Ok(new
    {
        datasetCount = ids.Count,
        datasetIds = ids
    });
});

app.Run();
