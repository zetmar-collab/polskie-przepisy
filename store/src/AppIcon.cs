using System.Reflection;

namespace PolskiePrzepisy;

/// <summary>Ikona okna wczytywana z zasobów pliku wykonywalnego.</summary>
internal static class AppIcon
{
    private static Icon? _cached;

    public static Icon? Load()
    {
        if (_cached is not null) return _cached;

        try
        {
            var exe = Assembly.GetEntryAssembly()?.Location;
            var path = Path.Combine(AppContext.BaseDirectory, "PolskiePrzepisy.exe");
            if (!File.Exists(path) && !string.IsNullOrEmpty(exe)) path = exe;
            _cached = Icon.ExtractAssociatedIcon(path);
        }
        catch
        {
            _cached = null;
        }

        return _cached;
    }
}
