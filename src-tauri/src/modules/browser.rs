use serde::Serialize;
use std::sync::mpsc;
use std::time::Duration;
use tauri::webview::{PageLoadEvent, PageLoadPayload};
use tauri::{AppHandle, Emitter, Manager, Runtime, Url, Webview};

const BROWSER_LABEL_PREFIX: &str = "browser-";
const PAGE_LOAD_EVENT: &str = "omnitab:browser-page-load";

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserPageLoadPayload {
    label: String,
    url: String,
    event: &'static str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowserState {
    url: String,
    title: String,
}

pub fn emit_page_load<R: Runtime>(webview: &Webview<R>, payload: &PageLoadPayload<'_>) {
    let label = webview.label();
    if !label.starts_with(BROWSER_LABEL_PREFIX) {
        return;
    }

    let event = match payload.event() {
        PageLoadEvent::Started => "started",
        PageLoadEvent::Finished => "finished",
    };
    let parent = webview.window().label().to_string();
    let payload = BrowserPageLoadPayload {
        label: label.to_string(),
        url: payload.url().to_string(),
        event,
    };
    let _ = webview
        .app_handle()
        .emit_to(parent, PAGE_LOAD_EVENT, payload);
}

#[tauri::command]
pub fn browser_navigate(app: AppHandle, label: String, url: String) -> Result<(), String> {
    let webview = browser_webview(&app, &label)?;
    webview
        .navigate(parse_web_url(&url)?)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_reload(app: AppHandle, label: String) -> Result<(), String> {
    let webview = browser_webview(&app, &label)?;
    webview.reload().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_stop(app: AppHandle, label: String) -> Result<(), String> {
    let webview = browser_webview(&app, &label)?;
    webview.eval("window.stop();").map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_go_back(app: AppHandle, label: String) -> Result<(), String> {
    let webview = browser_webview(&app, &label)?;
    webview.eval("history.back();").map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_go_forward(app: AppHandle, label: String) -> Result<(), String> {
    let webview = browser_webview(&app, &label)?;
    webview
        .eval("history.forward();")
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_set_zoom(app: AppHandle, label: String, zoom: f64) -> Result<(), String> {
    let webview = browser_webview(&app, &label)?;
    let zoom = zoom.clamp(0.25, 3.0);
    webview.set_zoom(zoom).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_clear_data(app: AppHandle, label: String) -> Result<(), String> {
    let webview = browser_webview(&app, &label)?;
    webview.clear_all_browsing_data().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn browser_state(app: AppHandle, label: String) -> Result<BrowserState, String> {
    let webview = browser_webview(&app, &label)?;
    let url = webview.url().map(|u| u.to_string()).unwrap_or_default();
    let title = eval_string(&webview, "document.title || ''").unwrap_or_default();
    Ok(BrowserState { url, title })
}

fn browser_webview(app: &AppHandle, label: &str) -> Result<Webview, String> {
    if !label.starts_with(BROWSER_LABEL_PREFIX) {
        return Err("invalid browser webview label".into());
    }
    app.get_webview(label)
        .ok_or_else(|| format!("browser webview not found: {label}"))
}

fn parse_web_url(raw: &str) -> Result<Url, String> {
    let url = Url::parse(raw).map_err(|e| e.to_string())?;
    match url.scheme() {
        "http" | "https" => Ok(url),
        _ => Err("only http and https URLs are supported in browser tabs".into()),
    }
}

fn eval_string(webview: &Webview, script: &str) -> Result<String, String> {
    let (tx, rx) = mpsc::channel();
    webview
        .eval_with_callback(script, move |value| {
            let _ = tx.send(value);
        })
        .map_err(|e| e.to_string())?;

    let raw = rx
        .recv_timeout(Duration::from_millis(700))
        .map_err(|_| "timed out reading page state".to_string())?;
    Ok(serde_json::from_str::<String>(&raw).unwrap_or(raw))
}
