using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// เตรียมเครื่องมือสำหรับส่ง HTTP Request
builder.Services.AddHttpClient();
builder.Services.AddHttpClient<ApifyDatasetService>();

// อนุญาตให้ Frontend จาก Vite เรียก Backend ได้
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("FrontendPolicy");

// Endpoint สำหรับตรวจสอบว่า Backend ทำงานหรือไม่
app.MapGet("/", () => "Apify Dataset Reader is running!");


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
        // อ่านโพสต์จากทุก Datasets
        var allPosts = await datasetService.GetAllPostsAsync(
            cancellationToken);

        // ตัดซ้ำ เรียงเวลา และเลือกจำนวนที่ต้องการ
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

// Get recent Instagram posts
app.MapGet("/api/posts/recent/instagram", async (
    string? profile,
    int? limit,
    ApifyDatasetService datasetService,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(profile))
    {
        return Results.BadRequest(new
        {
            error = "Please provide an Instagram profile.",
            example = "/api/posts/recent/instagram?profile=humansofny&limit=10"
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
        // อ่านโพสต์จากทุก Datasets ที่มีอยู่ใน Apify Storage
        var allPosts = await datasetService.GetAllPostsAsync(
            cancellationToken);

        // กรองเฉพาะ Instagram และเลือกโพสต์ล่าสุด
        var recentPosts = PostDataProcessor.GetRecentInstagramPosts(
            allPosts,
            profile,
            requestedLimit);

        return Results.Ok(new
        {
            profile,
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
            "Unable to retrieve datasets from Apify.",
            statusCode: 502);
    }
    catch (InvalidOperationException ex)
    {
        return Results.Problem(
            ex.Message,
            statusCode: 500);
    }
});


// Get recent TikTok posts
app.MapGet("/api/posts/recent/tiktok", async (
    string? profile,
    int? limit,
    ApifyDatasetService datasetService,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(profile))
    {
        return Results.BadRequest(new
        {
            error = "Please provide a TikTok profile.",
            example = "/api/posts/recent/tiktok?profile=khaby.lame&limit=10"
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
        // อ่านโพสต์จากทุก Datasets ที่มีอยู่ใน Apify Storage
        var allPosts = await datasetService.GetAllPostsAsync(
            cancellationToken);

        // กรองเฉพาะ TikTok และเลือกโพสต์ล่าสุด
        var recentPosts = PostDataProcessor.GetRecentTikTokPosts(
            allPosts,
            profile,
            requestedLimit);

        return Results.Ok(new
        {
            profile,
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
            "Unable to retrieve datasets from Apify.",
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


app.MapPost("/api/actors/instagram-scraper/run", async (
    JsonElement input,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration) =>
{
    // 1. อ่าน Apify Token จาก Configuration
    var token = configuration["Apify:Token"];

    if (string.IsNullOrWhiteSpace(token))
    {
        return Results.Problem(
            "Apify Token is missing.",
            statusCode: 500);
    }

    // 2. ตรวจสอบว่า Request Body เป็น JSON Object
    if (input.ValueKind != JsonValueKind.Object)
    {
        return Results.BadRequest(new
        {
            error = "Request body must be a JSON object."
        });
    }

    // 3. สร้าง URL สำหรับเรียก Instagram Scraper
    var url =
        "https://api.apify.com/v2/acts/" +
        "apify~instagram-scraper/" +
        "run-sync-get-dataset-items" +
        "?format=json";

    // 4. เตรียม HTTP Request
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
        // 5. ส่ง Request ไปยัง Apify
        using var response = await client.SendAsync(request);

        var json = await response.Content.ReadAsStringAsync();

        // 6. ตรวจสอบผลลัพธ์จาก Apify
        if (!response.IsSuccessStatusCode)
        {
            return Results.Problem(
                $"Apify returned HTTP {(int)response.StatusCode}: {json}",
                statusCode: 502);
        }

        // 7. ส่ง JSON กลับไปยัง Frontend
        return Results.Content(
            json,
            "application/json");
    }
    catch (TaskCanceledException)
    {
        return Results.Problem(
            "The Instagram Scraper request timed out.",
            statusCode: 504);
    }
    catch (HttpRequestException)
    {
        return Results.Problem(
            "Unable to connect to Apify.",
            statusCode: 502);
    }
});


app.MapPost("/api/actors/tiktok-posts-scraper/run", async (
    JsonElement input,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration) =>
{
    // 1. Read Apify Token
    var token = configuration["Apify:Token"];

    if (string.IsNullOrWhiteSpace(token))
    {
        return Results.Problem(
            "Apify Token is missing.",
            statusCode: 500);
    }

    // 2. Validate JSON input
    if (input.ValueKind != JsonValueKind.Object)
    {
        return Results.BadRequest(new
        {
            error = "Request body must be a JSON object."
        });
    }

    // 3. Apify Actor URL
    var url =
        "https://api.apify.com/v2/acts/" +
        "clockworks~tiktok-scraper/" +
        "run-sync-get-dataset-items" +
        "?format=json";

    // 4. Configure HTTP Client
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
        // 5. Send request to Apify
        using var response = await client.SendAsync(request);

        var json = await response.Content.ReadAsStringAsync();

        // 6. Handle Apify errors
        if (!response.IsSuccessStatusCode)
        {
            return Results.Problem(
                $"Apify returned HTTP {(int)response.StatusCode}: {json}",
                statusCode: 502);
        }

        // 7. Return original JSON to Frontend
        return Results.Content(
            json,
            "application/json");
    }
    catch (TaskCanceledException)
    {
        return Results.Problem(
            "The TikTok Scraper request timed out.",
            statusCode: 504);
    }
    catch (HttpRequestException)
    {
        return Results.Problem(
            "Unable to connect to Apify.",
            statusCode: 502);
    }
});


app.MapGet("/api/debug/tiktok", async (
    ApifyDatasetService datasetService,
    CancellationToken cancellationToken) =>
{
    var allPosts = await datasetService.GetAllPostsAsync(
        cancellationToken);

    var samples = allPosts
        .Take(10)
        .Select(post =>
        {
            string? author = null;

            if (post.TryGetProperty(
                "authorMeta.name", out var username))
            {
                author = username.ToString();
            }

            return new
            {
                author,
                properties = post.EnumerateObject()
                    .Select(p => p.Name)
                    .ToList()
            };
        })
        .ToList();

    return Results.Ok(new
    {
        totalScanned = allPosts.Count,
        samples
    });
});


app.Run();