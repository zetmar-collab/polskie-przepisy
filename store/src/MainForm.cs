using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace PolskiePrzepisy;

/// <summary>Okno główne — pełni rolę wbudowanej przeglądarki dla lokalnych plików aplikacji.</summary>
public sealed class MainForm : Form
{
    private readonly WebView2 _web = new() { Dock = DockStyle.Fill };

    public MainForm()
    {
        Text = "Polskie Przepisy";
        MinimumSize = new Size(800, 600);
        ClientSize = new Size(1200, 800);
        StartPosition = FormStartPosition.CenterScreen;
        Icon = AppIcon.Load();
        Controls.Add(_web);

        Load += async (_, _) => await InitializeWebViewAsync();
    }

    private async Task InitializeWebViewAsync()
    {
        try
        {
            var env = await CoreWebView2Environment.CreateAsync(
                browserExecutableFolder: WebViewRuntime.EmbeddedFolder,
                userDataFolder: WebViewRuntime.UserDataFolder);

            await _web.EnsureCoreWebView2Async(env);
        }
        catch (Exception ex)
        {
            Program.ShowFatal(ex);
            Close();
            return;
        }

        var core = _web.CoreWebView2;

        core.Settings.AreDevToolsEnabled = false;
        core.Settings.IsStatusBarEnabled = false;
        core.Settings.IsSwipeNavigationEnabled = false;
        core.Settings.IsGeneralAutofillEnabled = false;
        core.Settings.IsPasswordAutosaveEnabled = false;

        // Pliki aplikacji udostępniane pod adresem https://przepisy.local/
        core.SetVirtualHostNameToFolderMapping(
            Program.VirtualHost,
            Program.WebRoot,
            CoreWebView2HostResourceAccessKind.Allow);

        core.NewWindowRequested += OnNewWindowRequested;
        core.DocumentTitleChanged += (_, _) => Text = "Polskie Przepisy";

        core.Navigate($"https://{Program.VirtualHost}/index.html");
    }

    /// <summary>
    /// Linki do modeli AI otwieramy w przeglądarce systemowej,
    /// a okno wydruku (about:blank tworzone przez skrypt) w oknie potomnym aplikacji.
    /// </summary>
    private void OnNewWindowRequested(object? sender, CoreWebView2NewWindowRequestedEventArgs e)
    {
        var uri = e.Uri ?? string.Empty;

        var isExternal =
            (uri.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
             uri.StartsWith("https://", StringComparison.OrdinalIgnoreCase)) &&
            !uri.Contains(Program.VirtualHost, StringComparison.OrdinalIgnoreCase);

        if (isExternal)
        {
            e.Handled = true;
            Program.OpenExternal(uri);
            return;
        }

        // about:blank — okno wydruku przepisu
        e.Handled = true;
        var deferral = e.GetDeferral();
        var popup = new PopupForm(_web.CoreWebView2.Environment);
        popup.Ready += child =>
        {
            e.NewWindow = child;
            deferral.Complete();
        };
        popup.Show(this);
    }
}
