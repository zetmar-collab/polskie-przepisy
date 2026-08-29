namespace PolskiePrzepisy;

/// <summary>
/// Ustala, którego silnika WebView2 użyć.
/// Jeśli obok pliku wykonywalnego znajduje się folder <c>WebView2Runtime</c>
/// (wersja stała dołączona do pakietu), używamy jego — aplikacja jest wtedy
/// w pełni samodzielna i nie wymaga niczego zainstalowanego w systemie.
/// W przeciwnym razie korzystamy z komponentu WebView2 wbudowanego w Windows.
/// </summary>
internal static class WebViewRuntime
{
    private const string FolderName = "WebView2Runtime";

    /// <summary>Ścieżka do dołączonego silnika lub <c>null</c>, gdy go nie ma.</summary>
    public static string? EmbeddedFolder
    {
        get
        {
            var dir = Path.Combine(AppContext.BaseDirectory, FolderName);
            return File.Exists(Path.Combine(dir, "msedgewebview2.exe")) ? dir : null;
        }
    }

    /// <summary>Folder na dane użytkownika (cache, localStorage) — katalog aplikacji jest tylko do odczytu.</summary>
    public static string UserDataFolder
    {
        get
        {
            var dir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "PolskiePrzepisy",
                "WebView2");
            Directory.CreateDirectory(dir);
            return dir;
        }
    }
}
