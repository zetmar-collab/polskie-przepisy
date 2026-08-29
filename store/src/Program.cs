using System.Diagnostics;

namespace PolskiePrzepisy;

internal static class Program
{
    /// <summary>Nazwa hosta wirtualnego — dzięki niej strona działa w kontekście https
    /// (a nie file://), co odblokowuje schowek i localStorage.</summary>
    public const string VirtualHost = "przepisy.local";

    public static string WebRoot =>
        Path.Combine(AppContext.BaseDirectory, "wwwroot");

    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.SetHighDpiMode(HighDpiMode.PerMonitorV2);

        try
        {
            Application.Run(new MainForm());
        }
        catch (Exception ex)
        {
            ShowFatal(ex);
        }
    }

    /// <summary>Otwiera adres zewnętrzny w domyślnej przeglądarce systemu.</summary>
    public static void OpenExternal(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)) return;
        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) return;

        try
        {
            Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true });
        }
        catch
        {
            /* brak domyślnej przeglądarki — pomijamy */
        }
    }

    public static void ShowFatal(Exception ex)
    {
        MessageBox.Show(
            "Nie udało się uruchomić aplikacji.\n\n" + ex.Message,
            "Polskie Przepisy",
            MessageBoxButtons.OK,
            MessageBoxIcon.Error);
    }
}
