// Sending raw ESC/POS bytes to a printer.
//  - network: TCP to the printer's IP, port 9100 (no driver needed)
//  - usb:     through the operating system's print queue in RAW mode (Windows: the printer's
//             driver must be installed; any ESC/POS driver works, the job bypasses it)
const net = require("net");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");

function sendNetwork(host, port, data, timeoutMs = 7000) {
  return new Promise((resolve, reject) => {
    if (!host) return reject(new Error("لم يُحدَّد عنوان IP للطابعة"));
    const socket = new net.Socket();
    let done = false;
    const finish = (err) => {
      if (done) return;
      done = true;
      socket.destroy();
      err ? reject(err) : resolve();
    };
    socket.setTimeout(timeoutMs);
    socket.on("timeout", () => finish(new Error(`الطابعة لا ترد على ${host}:${port}`)));
    socket.on("error", (e) =>
      finish(new Error(e.code === "ECONNREFUSED" ? `الطابعة رفضت الاتصال على ${host}:${port}` : e.code === "EHOSTUNREACH" || e.code === "ENETUNREACH" ? `لا يمكن الوصول إلى ${host} — تحقق من كابل الشبكة` : e.message)),
    );
    socket.connect(Number(port) || 9100, host, () => {
      socket.write(data, (err) => {
        if (err) return finish(err);
        // Give the printer a moment to take the whole buffer before closing
        socket.end(() => setTimeout(() => finish(), 150));
      });
    });
  });
}

// Windows: write the bytes to the printer through the spooler (winspool WritePrinter, RAW datatype)
const WIN_RAW_PS = `
param([string]$printer, [string]$file)
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices;
public class GustoRaw {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] public class DOCINFO { public string pDocName; public string pOutputFile; public string pDataType; }
  [DllImport("winspool.drv", CharSet=CharSet.Unicode, SetLastError=true)] public static extern bool OpenPrinter(string n, out IntPtr h, IntPtr d);
  [DllImport("winspool.drv", SetLastError=true)] public static extern bool ClosePrinter(IntPtr h);
  [DllImport("winspool.drv", CharSet=CharSet.Unicode, SetLastError=true)] public static extern int StartDocPrinter(IntPtr h, int level, DOCINFO di);
  [DllImport("winspool.drv", SetLastError=true)] public static extern bool EndDocPrinter(IntPtr h);
  [DllImport("winspool.drv", SetLastError=true)] public static extern bool StartPagePrinter(IntPtr h);
  [DllImport("winspool.drv", SetLastError=true)] public static extern bool EndPagePrinter(IntPtr h);
  [DllImport("winspool.drv", SetLastError=true)] public static extern bool WritePrinter(IntPtr h, byte[] b, int n, out int w);
  public static void Send(string printer, byte[] bytes) {
    IntPtr h; if (!OpenPrinter(printer, out h, IntPtr.Zero)) throw new Exception("OpenPrinter failed: " + Marshal.GetLastWin32Error());
    try {
      var di = new DOCINFO { pDocName = "Gusto", pDataType = "RAW" };
      if (StartDocPrinter(h, 1, di) == 0) throw new Exception("StartDocPrinter failed: " + Marshal.GetLastWin32Error());
      StartPagePrinter(h); int w; bool ok = WritePrinter(h, bytes, bytes.Length, out w); EndPagePrinter(h); EndDocPrinter(h);
      if (!ok || w != bytes.Length) throw new Exception("WritePrinter failed: " + Marshal.GetLastWin32Error());
    } finally { ClosePrinter(h); }
  }
}
"@
[GustoRaw]::Send($printer, [System.IO.File]::ReadAllBytes($file))
`;

function sendSystem(printerName, data) {
  return new Promise((resolve, reject) => {
    if (!printerName) return reject(new Error("لم يُحدَّد اسم طابعة USB"));
    const tmp = path.join(os.tmpdir(), `gusto-print-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.bin`);
    fs.writeFileSync(tmp, data);
    const cleanup = () => fs.unlink(tmp, () => {});
    let cmd, args;
    if (process.platform === "win32") {
      const script = path.join(os.tmpdir(), "gusto-raw-print.ps1");
      fs.writeFileSync(script, WIN_RAW_PS);
      cmd = "powershell.exe";
      args = ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", script, "-printer", printerName, "-file", tmp];
    } else {
      cmd = "lp";
      args = ["-d", printerName, "-o", "raw", tmp];
    }
    execFile(cmd, args, { timeout: 20000, windowsHide: true }, (err, _stdout, stderr) => {
      cleanup();
      if (err) return reject(new Error(`فشل الإرسال إلى الطابعة "${printerName}": ${(stderr || err.message).toString().trim().split("\n").pop()}`));
      resolve();
    });
  });
}

/** Is a network printer reachable? Opens a connection and closes it without printing anything. */
function probeNetwork(host, port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    if (!host) return resolve({ ok: false, error: "لم يُضبط عنوان IP" });
    const started = Date.now();
    const socket = new net.Socket();
    const done = (r) => {
      socket.destroy();
      resolve(r);
    };
    socket.setTimeout(timeoutMs);
    socket.on("timeout", () => done({ ok: false, error: `لا ترد على ${host}:${port}` }));
    socket.on("error", (e) => done({ ok: false, error: e.code === "ECONNREFUSED" ? `رفضت الاتصال على ${host}:${port}` : `لا يمكن الوصول إلى ${host} (${e.code || e.message})` }));
    socket.connect(Number(port) || 9100, host, () => done({ ok: true, ms: Date.now() - started }));
  });
}

/** Send to a configured printer: { connection: 'network'|'usb', host, port, systemName } */
function send(printer, data) {
  return printer.connection === "usb" ? sendSystem(printer.systemName, data) : sendNetwork(printer.host, printer.port || 9100, data);
}

module.exports = { send, sendNetwork, sendSystem, probeNetwork };
