using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace PolskiePrzepisy;

/// <summary>Okno potomne używane przez skrypt do podglądu wydruku przepisu.</summary>
public sealed class PopupForm : Form
{
    private readonly WebView2 _web = new() { Dock = DockStyle.Fill };
    private readonly CoreWebView2Environment _env;
    private bool _initStarted;

    /// <summary>Zgłaszane, gdy silnik okna potomnego jest gotowy do przejęcia treści.</summary>
    public event Action<CoreWebView2>? Ready;

    public PopupForm(CoreWebView2Environment env)
    {
        _env = env;
        Text = "Polskie Przepisy — wydruk";
        ClientSize = new Size(900, 700);
        StartPosition = FormStartPosition.CenterParent;
        Icon = AppIcon.Load();
        Controls.Add(_web);
    }

    protected override async void OnHandleCreated(EventArgs e)
    {
        base.OnHandleCreated(e);
        if (_initStarted) return;
        _initStarted = true;

        try
        {
            await _web.EnsureCoreWebView2Async(_env);
        }
        catch (Exception ex)
        {
            Program.ShowFatal(ex);
            Close();
            return;
        }

        var core = _web.CoreWebView2;
        core.Settings.AreDevToolsEnabled = false;
        core.WindowCloseRequested += (_, _) => Close();
        core.NewWindowRequested += (_, args) =>
        {
            args.Handled = true;
            Program.OpenExternal(args.Uri ?? string.Empty);
        };

        Ready?.Invoke(core);
    }
}
