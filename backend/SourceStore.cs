using System.Text.Json;

public sealed class SourceStore
{
private readonly string _filePath;
private readonly SemaphoreSlim _lock = new(1, 1);


public SourceStore(IWebHostEnvironment environment)
{
    var dataDirectory = Path.Combine(
        environment.ContentRootPath,
        "data");

    Directory.CreateDirectory(dataDirectory);

    _filePath = Path.Combine(dataDirectory, "sources.json");

    if (!File.Exists(_filePath))
    {
        File.WriteAllText(_filePath, "[]");
    }
}

public async Task<List<JsonElement>> GetAllAsync()
{
    await _lock.WaitAsync();

    try
    {
        var json = await File.ReadAllTextAsync(_filePath);

        return JsonSerializer.Deserialize<List<JsonElement>>(json)
            ?? new List<JsonElement>();
    }
    finally
    {
        _lock.Release();
    }
}

public async Task AddAsync(JsonElement source)
{
    await _lock.WaitAsync();

    try
    {
        var json = await File.ReadAllTextAsync(_filePath);

        var sources =
            JsonSerializer.Deserialize<List<JsonElement>>(json)
            ?? new List<JsonElement>();

        sources.RemoveAll(existing =>
            existing.TryGetProperty("id", out var existingId) &&
            source.TryGetProperty("id", out var newId) &&
            existingId.ToString() == newId.ToString());

        sources.Add(source.Clone());

        var options = new JsonSerializerOptions
        {
            WriteIndented = true
        };

        await File.WriteAllTextAsync(
            _filePath,
            JsonSerializer.Serialize(sources, options));
    }
    finally
    {
        _lock.Release();
    }
}


}
