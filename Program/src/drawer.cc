#include <napi.h>
#include <windows.h>
#include <stdio.h>

#define UINT32ARG(v) ((v).As<Napi::Number>().Uint32Value())
#define HVAL(h) Napi::Number::New(env, (uint32_t)(h))
#define INTVAL(i) Napi::Number::New(env, (i))

static WCHAR *windowClassName = L"DRAWERWINDOW";

static LRESULT CALLBACK WndProc(HWND hwnd, UINT message, WPARAM wParam, LPARAM lParam){
    return DefWindowProc(hwnd, message, wParam, lParam);
}

BOOL initWindowClass(void){
    WNDCLASSW wndClass;
    ZeroMemory(&wndClass, sizeof(wndClass));
    wndClass.lpfnWndProc = WndProc;
    wndClass.hInstance = GetModuleHandle(NULL);
    wndClass.lpszClassName = windowClassName;
    if( !RegisterClassW(&wndClass) ){
        return false;
    } else {
        return true;
    }
}

static HWND create_window(){
    return CreateWindowW(windowClassName, L"Dummy Window", WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT,
        NULL, NULL, GetModuleHandle(NULL), NULL);
}

static BOOL dispose_window(HWND hwnd){
    return DestroyWindow(hwnd);
}

static void parse_devnames(DEVNAMES *devnames, WCHAR **driver, WCHAR **device, WCHAR **output)
{
    *driver = (WCHAR *)(((WCHAR *)devnames) + devnames->wDriverOffset);
    *device = (WCHAR *)(((WCHAR *)devnames) + devnames->wDeviceOffset);
    *output = (WCHAR *)(((WCHAR *)devnames) + devnames->wOutputOffset);
}

Napi::Value createWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() != 0) {
        throw Napi::Error::New(env,
            "wrong number of arguments, usage: createWindow()");
    }
    // createWindow()
    HWND hwnd = create_window();
    if( hwnd == NULL ){
        printf("%d\n", GetLastError());
        throw Napi::Error::New(env, "create_window failed");
    }
    return Napi::Number::New(env, (uint32_t)hwnd);
}

Napi::Value disposeWindow(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // disposeWindow(hwnd)
    if( info.Length() != 1 ){
        throw Napi::Error::New(env,
            "wrong number of arguments, usage: disposeWindow(hwnd)");
    }
    if( !info[0].IsNumber() ){
        throw Napi::Error::New(env,
            "wrong type, usage: disposeWindow(hwnd)");
    }
    HWND hwnd = (HWND)UINT32ARG(info[0]);
    BOOL ok = dispose_window(hwnd);
    return Napi::Boolean::New(env, ok);
}

Napi::Value getDc(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // getDc(hwnd)
    if( info.Length() != 1 ){
        throw Napi::Error::New(env,
            "wrong number of arguments, usage: getDC(hwnd)");
    }
    if( !info[0].IsNumber() ){
        throw Napi::Error::New(env,
            "wrong type, usage: getDc(hwnd)");
    }
    HWND hwnd = (HWND)UINT32ARG(info[0]);
    HDC hdc = GetDC(hwnd);
    return Napi::Number::New(env, (uint32_t)hdc);
}

Napi::Value releaseDc(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // releaseDc(hwnd, hdc)
    if( info.Length() != 2 ){
        throw Napi::Error::New(env,
            "wrong number of arguments, usage: releaseDc(hwnd,hdc)");
    }
    if( !info[0].IsNumber() || !info[1].IsNumber() ){
        throw Napi::Error::New(env,
            "wrong type(s), usage: releaseDc(hwnd,hdc)");
    }
    HWND hwnd = (HWND)UINT32ARG(info[0]);
    HDC hdc = (HDC)UINT32ARG(info[1]);
    BOOL ok = ReleaseDC(hwnd, hdc);
    return Napi::Boolean::New(env, ok);
}

Napi::Value measureText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // measureText(hdc, string) => { cx:..., cy:... }
    if( info.Length() != 2 ){
        throw Napi::Error::New(env,
            "wrong number of arguments, usage: measureText(hdc,string)");
    }
    if( !info[0].IsNumber() || !info[1].IsString() ){
        throw Napi::Error::New(env,
            "wrong type(s), usage: measureText(hdc,string)");
    }
    HDC hdc = (HDC)UINT32ARG(info[0]);
    std::u16string textValue = info[1].As<Napi::String>();
    SIZE mes;
    BOOL ok = GetTextExtentPoint32W(hdc, (LPCWSTR)textValue.c_str(),
        textValue.length(), &mes);
    if( !ok ){
        throw Napi::Error::New(env,
            "GetTextExtentPoint32W failed");
    }
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("cx", mes.cx);
    obj.Set("cy", mes.cy);
    return obj;
}

Napi::Value createFont(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // createFont(fontname, size, weight?, italic?) ==> HANDLE
    if( info.Length() < 2 || info.Length() > 4 ){
        throw Napi::Error::New(env,
            "wrong number of arguments, usage: createFont(fontname,size[,weight[,italic]])");
    }
    if( !info[0].IsString() ){
        throw Napi::Error::New(env,
            "wrong type for fontname, usage: createFont(fontname,size[,weight[,italic]])");
    }
    if( !info[1].IsNumber() ){
        throw Napi::Error::New(env,
            "wrong type for size, usage: createFont(fontname,size[,weight[,italic]])");
    }
    if( info.Length() >= 3 && !info[2].IsNumber() ){
        throw Napi::Error::New(env,
            "wrong type for weight, usage: createFont(fontname,size[,weight[,italic]])");
    }
    if( info.Length() >= 4 && !info[3].IsNumber() ){
        throw Napi::Error::New(env,
            "wrong type for italic, usage: createFont(fontname,size[,weight[,italic]])");
    }
    std::u16string fontName = info[0].As<Napi::String>();

    uint32_t size = UINT32ARG(info[1]);
    long weight = info.Length() >= 3 ? UINT32ARG(info[2]) : 0;
    long italic = info.Length() >= 4 ? UINT32ARG(info[3]) : 0;

    LOGFONTW logfont;
    ZeroMemory(&logfont, sizeof(logfont));
    logfont.lfHeight = size;
    logfont.lfWeight = weight;
    logfont.lfItalic = static_cast<BYTE>(italic);
    logfont.lfCharSet = DEFAULT_CHARSET;
    logfont.lfOutPrecision = OUT_DEFAULT_PRECIS;
    logfont.lfClipPrecision = CLIP_DEFAULT_PRECIS;
    logfont.lfQuality = DEFAULT_QUALITY;
    logfont.lfPitchAndFamily = DEFAULT_PITCH;
    if( wcscpy_s(logfont.lfFaceName, LF_FACESIZE,
        (const wchar_t *)fontName.c_str()) != 0 ){
        throw Napi::Error::New(env,
            "font name too long");
    }
    HFONT font = CreateFontIndirectW(&logfont);
    return Napi::Number::New(env, (uint32_t)font);
}

class EnumFontsArgs {
    public:
    Napi::Array ret;
    Napi::Env env;
    EnumFontsArgs(Napi::Env envarg) : env(envarg) {
        ret = Napi::Array::New(env);
    }
};

int CALLBACK enumFontsProc(
    const LOGFONTW    *lpelfe,
    const TEXTMETRICW *lpntme,
    DWORD      FontType,
    LPARAM     lParam
) {
    EnumFontsArgs *args = (EnumFontsArgs *)lParam;
    if (lpelfe->lfFaceName[0] != L'@') {
        Napi::Object obj = Napi::Object::New(args->env);
        obj.Set("name", (const char16_t *)lpelfe->lfFaceName);
        // obj.Set("charset", lpelfe->lfCharSet);
        // obj.Set("italic", lpelfe->lfItalic);
        // obj.Set("weight", lpelfe->lfWeight);
        obj.Set("pitchAndFamily", lpelfe->lfPitchAndFamily);
        obj.Set("pitch", lpelfe->lfPitchAndFamily & 3);
        obj.Set("family", lpelfe->lfPitchAndFamily >> 4);
        args->ret.Set(args->ret.Length(), obj);
    }
    return 1;
}

Napi::Value enumFonts(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if( info.Length() != 0 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: enumFonts()");
    }
    HDC hdc = CreateDCA("DISPLAY", NULL, NULL, NULL);
    LOGFONTW logfont;
    logfont.lfCharSet = ANSI_CHARSET;
    if( wcscpy_s(logfont.lfFaceName, LF_FACESIZE, L"") != 0 ){
        throw Napi::Error::New(env,
            "empty-string font name too long?!?");
    }
    logfont.lfPitchAndFamily = 0;
    EnumFontsArgs args(env);
    (void) EnumFontFamiliesExW(hdc, &logfont, enumFontsProc, (LPARAM) &args, 0);
    (void) DeleteDC(hdc);

    return args.ret;
}

Napi::Value deleteObject(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // deleteObject(obj)
    if( info.Length() != 1 ){
        throw Napi::Error::New(env,
            "wrong number of arguments, usage: deleteObject(handle)");
    }
    if( !info[0].IsNumber() ){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    HANDLE object = (HANDLE)UINT32ARG(info[0]);
    BOOL ok = DeleteObject(object);
    return Napi::Boolean::New(env, ok);
}

Napi::Value getDpiOfHdc(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // getDpiOfHdc(hdc)
    if( info.Length() != 1 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsNumber() ){
        throw Napi::Error::New(env, "wrong type, usage: getdpiOfHdc(hdc)");
    }
    HDC hdc = (HDC)UINT32ARG(info[0]);
    int dpix = GetDeviceCaps(hdc, LOGPIXELSX);
    int dpiy = GetDeviceCaps(hdc, LOGPIXELSY);
    int horzres = GetDeviceCaps(hdc, HORZRES);
    int vertres = GetDeviceCaps(hdc, VERTRES);
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("dpix", dpix);
    obj.Set("dpiy", dpiy);
    obj.Set("horzres", horzres);
    obj.Set("vertres", vertres);
    return obj;
}

static HANDLE alloc_handle(void *data, int len)
{
    HANDLE handle;
    void *ptr;

    handle = GlobalAlloc(GHND, len);
    ptr = GlobalLock(handle);
    memmove(ptr, data, len);
    GlobalUnlock(handle);
    return handle;
}

Napi::Value printerDialog(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // printerDialog(devmode?, devnames?)
    HWND hwnd = create_window();
    if( hwnd == NULL ){
        throw Napi::Error::New(env, "create_window failed");
    }
    DEVMODEW *devmodePtr = NULL;
    int devmodeLength = 0;
    DEVNAMES *devnamesPtr = NULL;
    int devnamesLength = 0;
    if( info.Length() >= 1 ){
        if( !info[0].IsObject() ){
            throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
        }
        Napi::Object obj = info[0].As<Napi::Object>();
        // devmodePtr = (DEVMODEW *)node::Buffer::Data(obj);
        // devmodeLength = node::Buffer::Length(obj);
        throw Napi::Error::New(env, "DEVMODE as buffer not supported");
    }
    if( info.Length() >= 2 ){
        if( !info[1].IsObject() ){
            throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
        }
        Napi::Object obj = info[1].As<Napi::Object>();
        throw Napi::Error::New(env, "DEVNAMES as buffer not supported");
        // devnamesPtr = (DEVNAMES *)node::Buffer::Data(obj);
        // devnamesLength = node::Buffer::Length(obj);
    }
    PRINTDLGEXW pd;
    ZeroMemory(&pd, sizeof(pd));
    pd.lStructSize = sizeof(pd);
    pd.hwndOwner = hwnd;
    pd.Flags = PD_NOPAGENUMS;
    pd.nCopies = 1;
    pd.nStartPage = START_PAGE_GENERAL;
    if( devmodePtr ){
        pd.hDevMode = alloc_handle(devmodePtr, devmodeLength);
    }
    if( devnamesPtr ){
        pd.hDevNames = alloc_handle(devnamesPtr, devnamesLength);
    }
    HRESULT res = PrintDlgExW(&pd);
    dispose_window(hwnd);
    if( res == S_OK && pd.dwResultAction != PD_RESULT_CANCEL ){
        throw Napi::Error::New(env, "returning DEVMODE and DEVNAMES as buffers not supported");
        // DEVMODEW *devmodePtr = (DEVMODEW *)GlobalLock(pd.hDevMode);
        // int devmodeLength = sizeof(DEVMODEW) + devmodePtr->dmDriverExtra;
        // Local<Object> devmodeBuffer = Nan::CopyBuffer((char *)devmodePtr, devmodeLength).ToLocalChecked();
        // GlobalUnlock(pd.hDevMode);
        // GlobalFree(pd.hDevMode);
        // DEVNAMES *devnamesPtr = (DEVNAMES *)GlobalLock(pd.hDevNames);
        // WCHAR *outputPtr = ((WCHAR *)devnamesPtr) + devnamesPtr->wOutputOffset;
        // int outputLen = wcslen(outputPtr);
        // int devnamesLength = (devnamesPtr->wOutputOffset + outputLen + 1) * 2;
        // Local<Object> devnamesBuffer = Nan::CopyBuffer((char *)devnamesPtr, devnamesLength).ToLocalChecked();
        // GlobalUnlock(pd.hDevNames);
        // GlobalFree(pd.hDevNames);
        // Napi::Object obj = Napi::Object::New(env);;
        // obj->Set(Nan::New("devmode").ToLocalChecked(), devmodeBuffer);
        // obj->Set(Nan::New("devnames").ToLocalChecked(), devnamesBuffer);
        // return obj;
    } else {
        return Napi::Boolean::New(env, false);
    }
}

Napi::Value parseDevmode(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // parseDevmode(devmode)
    if( info.Length() < 1 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsObject() ){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    throw Napi::Error::New(env, "DEVMODE as buffer not supported");
    // Local<Object> devmodeBuffer = info[0]->ToObject(Nan::GetCurrentContext()).ToLocalChecked();
    // DEVMODEW *devmodePtr = (DEVMODEW *)node::Buffer::Data(devmodeBuffer);
    // DWORD fields = devmodePtr->dmFields;
    // const uint16_t *cDevName = (const uint16_t *)devmodePtr->dmDeviceName;
    // Local<String> deviceName = Nan::New(cDevName, lstrlenW((LPCWSTR)cDevName)).ToLocalChecked();
    // Napi::Object obj = Napi::Object::New(env);;
    // obj->Set(Nan::New("deviceName").ToLocalChecked(), deviceName);
    // obj.Set("orientation", devmodePtr->dmOrientation);
    // obj.Set("paperSize", devmodePtr->dmPaperSize);
    // obj.Set("copies", devmodePtr->dmCopies);
    // obj.Set("printQuality", devmodePtr->dmPrintQuality);
    // obj.Set("defaultSource", devmodePtr->dmDefaultSource);
    // return obj;
}

Napi::Value parseDevnames(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // parseDevnames(devnames)
    if( info.Length() < 1 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsObject() ){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    throw Napi::Error::New(env, "DEVNAMES as buffer not supported");
    // Local<Object> devnamesBuffer = info[0]->ToObject(Nan::GetCurrentContext()).ToLocalChecked();
    // DEVNAMES *data = (DEVNAMES *)node::Buffer::Data(devnamesBuffer);
    // WCHAR *driver, *device, *output;
    // parse_devnames(data, &driver, &device, &output);
    // Local<String> driverString = Nan::New((const uint16_t *)driver, lstrlenW(driver)).ToLocalChecked();
    // Local<String> deviceString = Nan::New((const uint16_t *)device, lstrlenW(device)).ToLocalChecked();
    // Local<String> outputString = Nan::New((const uint16_t *)output, lstrlenW(output)).ToLocalChecked();
    // Napi::Object obj = Napi::Object::New(env);;
    // obj.Set("driver", driverString);
    // obj.Set("device", deviceString);
    // obj.Set("output", outputString);
    // return obj;
}

Napi::Value createDc(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // createDc(devmode, devnames)
    if( info.Length() < 2 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsObject() || !info[1].IsObject() ){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    throw Napi::Error::New(env, "DEVMODE and DEVNAMES as buffers not supported");
    // DEVMODEW *devmodePtr = (DEVMODEW *)node::Buffer::Data(info[0]->ToObject(Nan::GetCurrentContext()).ToLocalChecked());
    // DEVNAMES *devnamesPtr = (DEVNAMES *)node::Buffer::Data(info[1]->ToObject(Nan::GetCurrentContext()).ToLocalChecked());
    // WCHAR *driver, *device, *output;
    // parse_devnames(devnamesPtr, &driver, &device, &output);
    // HDC hdc = CreateDCW(driver, device, NULL, devmodePtr);
    // if( hdc == NULL ){
        // throw Napi::Error::New(env, "createDC failed");
        // return;
    // }
    // return Napi::Number::New(env, (uint32_t)hdc);
}

// Key parts are from
// https://docs.microsoft.com/en-us/troubleshoot/windows/win32/modify-printer-settings-documentproperties
LPDEVMODEW makeDEVMODE(std::u16string& device, Napi::Object& params) {
    HANDLE hPrinter;
    LPDEVMODEW pDevMode;
    DWORD dwNeeded, dwRet;
    LPWSTR pDevice = (LPWSTR)device.c_str();

    /* Start by opening the printer */
    if (!OpenPrinterW(pDevice, &hPrinter, NULL))
        return NULL;

    /*
     * Step 1:
     * Allocate a buffer of the correct size.
     */
    dwNeeded = DocumentPropertiesW(NULL,
        hPrinter, /* Handle to our printer. */
        pDevice, /* Name of the printer. */
        NULL, /* Asking for size, so */
        NULL, /* these are not used. */
        0); /* Zero returns buffer size. */
    pDevMode = (LPDEVMODEW)malloc(dwNeeded);

    /*
     * Step 2:
     * Get the default DevMode for the printer and
     * modify it for your needs.
     */
    dwRet = DocumentPropertiesW(NULL,
        hPrinter,
        pDevice,
        pDevMode, /* The address of the buffer to fill. */
        NULL, /* Not using the input buffer. */
        DM_OUT_BUFFER); /* Have the output buffer filled. */
    if (dwRet != IDOK) {
        /* If failure, cleanup and return failure. */
        free(pDevMode);
        ClosePrinter(hPrinter);
        return NULL;
    }

    /*
     * Make changes to the DevMode which are supported.
     */
    // if (pDevMode->dmFields & DM_ORIENTATION) {
        // /* If the printer supports paper orientation, set it.*/
        // pDevMode->dmOrientation = DMORIENT_LANDSCAPE;
    // }
#define DMU32(flag, name) {                                         \
        if ((pDevMode->dmFields & flag) && params.Has(#name)) {     \
            pDevMode->name = UINT32ARG(params.Get(#name));          \
        }                                                           \
    }
    DMU32(DM_ORIENTATION, dmOrientation);
    DMU32(DM_DUPLEX, dmDuplex);
    DMU32(DM_PAPERSIZE, dmPaperSize);
    DMU32(DM_COPIES, dmCopies);
    DMU32(DM_PAPERLENGTH, dmPaperLength);
    DMU32(DM_PAPERWIDTH, dmPaperWidth);

    /*
     * Step 3:
     * Merge the new settings with the old.
     * This gives the driver an opportunity to update any private
     * portions of the DevMode structure.
     */
    dwRet = DocumentPropertiesW(NULL,
        hPrinter,
        pDevice,
        pDevMode, /* Reuse our buffer for output. */
        pDevMode, /* Pass the driver our changes. */
        DM_IN_BUFFER | /* Commands to Merge our changes and */
        DM_OUT_BUFFER); /* write the result. */

    /* Finished with the printer */
    ClosePrinter(hPrinter);

    if (dwRet != IDOK) {
        /* If failure, cleanup and return failure. */
        free(pDevMode);
        return NULL;
    }

    /* Return the modified DevMode structure. */
    return pDevMode;
}

Napi::Value createDc2(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    // createDC(params)
    if( info.Length() < 1 || info.Length() > 2){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsString()){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    if (info.Length() > 1 && !info[1].IsObject()) {
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    std::u16string device = info[0].As<Napi::String>();
    DEVMODEW *devmode = NULL;
    if (info.Length() > 1) {
        Napi::Object params = info[1].As<Napi::Object>();
        devmode = makeDEVMODE(device, params);
        if (devmode == NULL) {
            throw Napi::Error::New(env, "makeDEVMODE failed");
        }
    }
    HDC hdc = CreateDCW(NULL, (LPCWSTR)device.c_str(), NULL, devmode);
    free(devmode);
    if (hdc == NULL) {
        throw Napi::Error::New(env, "CreateDCW failed");
    }
    return Napi::Number::New(env, (uint32_t)hdc);

}

Napi::Value deleteDc(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // deleteDc(hdc)
    if( info.Length() != 1 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsNumber() ){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    HDC hdc = (HDC)UINT32ARG(info[0]);
    BOOL ok = DeleteDC(hdc);
    return Napi::Boolean::New(env, ok);
}

Napi::Value beginPrint(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // beginPrint(hdc)
    if( info.Length() != 1 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsNumber() ){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    HDC hdc = (HDC)UINT32ARG(info[0]);
    DOCINFOW docinfo;
    ZeroMemory(&docinfo, sizeof(docinfo));
    docinfo.cbSize = sizeof(docinfo);
    docinfo.lpszDocName = L"drawer printing";
    int ret = StartDocW(hdc, &docinfo);
    if( ret <= 0 ){
        throw Napi::Error::New(env, "StartDoc failed");
    }
    return Napi::Number::New(env, ret);
}

Napi::Value endPrint(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // endPrint(hdc)
    if( info.Length() < 1 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsNumber() ){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    HDC hdc = (HDC)UINT32ARG(info[0]);
    int ret = EndDoc(hdc);
    if( ret <= 0 ){
        throw Napi::Error::New(env, "EndDoc failed");
    }
    return Napi::Number::New(env, ret);
}

Napi::Value abortPrint(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // abortPrint(hdc)
    if( info.Length() < 1 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsNumber() ){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    HDC hdc = (HDC)UINT32ARG(info[0]);
    int ret = AbortDoc(hdc);
    if( ret <= 0 ){
        throw Napi::Error::New(env, "AbortDoc failed");
    }
    return Napi::Number::New(env, ret);
}

Napi::Value startPage(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // startPage(hdc)
    if( info.Length() < 1 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsNumber() ){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    HDC hdc = (HDC)UINT32ARG(info[0]);
    int ret = StartPage(hdc);
    if( ret <= 0 ){
        throw Napi::Error::New(env, "StartPage failed");
    }
    return Napi::Number::New(env, ret);
}

Napi::Value endPage(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // endPage(hdc)
    if( info.Length() < 1 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsNumber() ){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    HDC hdc = (HDC)UINT32ARG(info[0]);
    int ret = EndPage(hdc);
    if( ret <= 0 ){
        throw Napi::Error::New(env, "EndPage failed");
    }
    return Napi::Number::New(env, ret);
}

Napi::Value moveTo(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // moveTo(hdc, x, y)
    if( info.Length() < 3 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsNumber() || !info[1].IsNumber() || !info[2].IsNumber() ){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    HDC hdc = (HDC)UINT32ARG(info[0]);
    long x = UINT32ARG(info[1]);
    long y = UINT32ARG(info[2]);
    BOOL ok = MoveToEx(hdc, x, y, NULL);
    if( !ok ){
        throw Napi::Error::New(env, "MoveToEx failed");
    }
    return Napi::Boolean::New(env, ok);
}

Napi::Value lineTo(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // lineTo(hdc, x, y)
    if( info.Length() < 3 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsNumber() || !info[1].IsNumber() || !info[2].IsNumber() ){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    HDC hdc = (HDC)UINT32ARG(info[0]);
    long x = UINT32ARG(info[1]);
    long y = UINT32ARG(info[2]);
    BOOL ok = LineTo(hdc, x, y);
    if( !ok ){
        throw Napi::Error::New(env, "LineTo failed");
    }
    return Napi::Boolean::New(env, ok);
}

Napi::Value textOut(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // textOut(hdc, x, y, text)
    if( info.Length() < 4 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsNumber() || !info[1].IsNumber() || !info[2].IsNumber() || !info[3].IsString() ){
        throw Napi::Error::New(env, "textOut: wrong arguments");
    }
    HDC hdc = (HDC)UINT32ARG(info[0]);
    long x = UINT32ARG(info[1]);
    long y = UINT32ARG(info[2]);
    std::u16string textValue(info[3].As<Napi::String>());

    BOOL ok = TextOutW(hdc, x, y, (LPWSTR)textValue.c_str(), textValue.length());
    if( !ok ){
        throw Napi::Error::New(env, "TextOutW failed");
    }
    return Napi::Boolean::New(env, ok);
}

Napi::Value selectObject(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // selectObject(hdc, handle)
    if( info.Length() < 2 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsNumber() || !info[1].IsNumber() ){
        throw Napi::Error::New(env, "selectObject: wrong arguments");
    }
    HDC hdc = (HDC)UINT32ARG(info[0]);
    HANDLE obj = (HANDLE)UINT32ARG(info[1]);
    HANDLE prev = SelectObject(hdc, obj);
    if( prev == NULL || prev == HGDI_ERROR ){
        throw Napi::Error::New(env, "SelectObject failed");
    }
    return Napi::Number::New(env, (uint32_t)prev);
}

Napi::Value setTextColor(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // setTextColor(hdc, r, g, b)
    if( info.Length() < 4 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsNumber() || !info[1].IsNumber() || !info[2].IsNumber() || !info[3].IsNumber() ){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    HDC hdc = (HDC)UINT32ARG(info[0]);
    long r = UINT32ARG(info[1]);
    long g = UINT32ARG(info[2]);
    long b = UINT32ARG(info[3]);
    COLORREF ret = SetTextColor(hdc, RGB(r, g, b));
    if( ret == CLR_INVALID ){
        throw Napi::Error::New(env, "SetTextColor failed");
    }
    return Napi::Boolean::New(env, false);
}

Napi::Value createPen(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // createPen(width, r, g, b)
    if( info.Length() < 4 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsNumber() || !info[1].IsNumber() || !info[2].IsNumber() || !info[3].IsNumber() ){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    long width = UINT32ARG(info[0]);
    long r = UINT32ARG(info[1]);
    long g = UINT32ARG(info[2]);
    long b = UINT32ARG(info[3]);
    HPEN pen = CreatePen(PS_SOLID, width, RGB(r, g, b));
    if( pen == NULL ){
        throw Napi::Error::New(env, "CreatePen failed");
    }
    return HVAL(pen);
}

Napi::Value setBkMode(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // setBkMode(hdc, mode)
    if( info.Length() < 2 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsNumber() || !info[1].IsNumber() ){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    HDC hdc = (HDC)UINT32ARG(info[0]);
    int mode = UINT32ARG(info[1]);
    int prev = SetBkMode(hdc, mode);
    if( prev == 0 ){
        throw Napi::Error::New(env, "SetBkMode failed");
    }
    return INTVAL(prev);
}

Napi::Value setTextAlign(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // setTextAlign(hdc, align)
    if( info.Length() < 2 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsNumber() || !info[1].IsNumber() ){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    HDC hdc = (HDC)UINT32ARG(info[0]);
    int align = UINT32ARG(info[1]);
    int prev = SetTextAlign(hdc, align);
    if( prev == GDI_ERROR ){
        throw Napi::Error::New(env, "SetTextAlign failed");
    }
    return INTVAL(prev);
}

Napi::Value getTextAlign(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // getTextAlign(hdc)
    if( info.Length() != 1 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }
    if( !info[0].IsNumber()){
        throw Napi::Error::New(env, "wrong type, usage: xxx(yyy)");
    }
    HDC hdc = (HDC)UINT32ARG(info[0]);
    int align = GetTextAlign(hdc);
    if( align == GDI_ERROR ){
        throw Napi::Error::New(env, "GetTextAlign failed");
    }
    return INTVAL(align);
}

#define SET(obj, name, val) (obj).Set((name), (val))
#define SET2(obj, name, val) (obj).Set((name), (val))
#define SETSTRMAYBE(obj, name, val) do {    \
        if (val != NULL) {                  \
            (obj).Set(name, (const char16_t *)val);         \
        }                                   \
    } while(0)

Napi::Object enumPrinterAttributes(Napi::Env env, DWORD attrs) {
    Napi::Object obj = Napi::Object::New(env);;
#define A(sym)  do {                                                            \
        if (attrs & PRINTER_ATTRIBUTE_##sym) {                                  \
            SET2(obj, #sym, true);                                              \
        }                                                                       \
    } while (0)
    A(DEFAULT);
    A(DIRECT);
    A(DO_COMPLETE_FIRST);
    A(ENABLE_BIDI);
    A(ENABLE_DEVQ);
    A(FAX);
    A(FRIENDLY_NAME);
    A(HIDDEN);
    A(KEEPPRINTEDJOBS);
    A(LOCAL);
    A(MACHINE);
    A(NETWORK);
    A(PUBLISHED);
    A(PUSHED_MACHINE);
    A(PUSHED_USER);
    A(QUEUED);
    A(RAW_ONLY);
    A(SHARED);
    A(TS);
    A(WORK_OFFLINE);
#undef A
    return (obj);
}

Napi::Object enumPrinterFlags(Napi::Env env, DWORD attrs) {
    Napi::Object obj = Napi::Object::New(env);;
#define F(sym)  do {                                                            \
        if (attrs & PRINTER_ENUM_##sym) {                                   \
            SET2(obj, #sym, true);                                              \
        }                                                                       \
    } while (0)
    F(EXPAND);
    F(CONTAINER);
    F(ICON1);
    F(ICON2);
    F(ICON3);
    F(ICON4);
    F(ICON5);
    F(ICON6);
    F(ICON7);
    F(ICON8);
#undef F
    return (obj);
}

Napi::Value enumPrinters(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    // parseDevnames(devnames)
    if( info.Length() != 3 ){
        throw Napi::Error::New(env, "wrong number of arguments, usage: xxx(yyy)");
    }

    if( !info[0].IsNumber() ){
        throw Napi::Error::New(env, "wrong type for flags");
    }
    int flags = UINT32ARG(info[0]);

    // NEEDSWORK:  This converts null into a string, which we then
    // ignore.  It would be better to never create the String::Value
    // if the argument is null, but I don't see how to do that and
    // keep the String::Value (if initialized) in scope.
    // Well, without using "new" to create one, but I don't want to
    // have to mess around with memory management.
    // (I think.  I haven't re-analyzed the situation after the change
    // to NAPI.)
    std::u16string nameparam(info[1].ToString());
    LPWSTR lpwName;
    if (info[1].IsNull()) {
        lpwName = NULL;
    } else if(info[1].IsString() ){
        lpwName = (LPWSTR)nameparam.c_str();
    } else {
        throw Napi::Error::New(env, "wrong type for name");
    }

    if( !info[2].IsNumber() ){
        throw Napi::Error::New(env, "wrong type for level");
    }
    int level = UINT32ARG(info[2]);
    if (level != 1 && level != 2 && level != 4 && level != 5) {
        throw Napi::Error::New(env, "level must be 1, 2, 4, or 5");
    }

    DWORD needed;
    DWORD returned;
    if (!EnumPrintersW(flags, lpwName, level, NULL, 0, &needed, &returned)
        && GetLastError() != ERROR_INSUFFICIENT_BUFFER) {
        printf("error = 0x%x\n", GetLastError());
        throw Napi::Error::New(env, "First EnumPrinters failed");
    }
    std::vector<BYTE> buf(needed);
    if (!EnumPrintersW(flags, lpwName, level, buf.data(), needed, &needed, &returned)) {
        throw Napi::Error::New(env, "Second EnumPrinters failed");
    }

    Napi::Array a = Napi::Array::New(env, returned);
    for (unsigned int u = 0; u < returned; u++) {
        Napi::Object obj = Napi::Object::New(env);;
        switch(level) {
        case 1:
            {
                _PRINTER_INFO_1W *pi1 = ((_PRINTER_INFO_1W *)buf.data()) + u;
                SETSTRMAYBE(obj, "description", pi1->pDescription);
                SETSTRMAYBE(obj, "name", pi1->pName);
                SETSTRMAYBE(obj, "comment", pi1->pComment);
                obj.Set("flags", enumPrinterFlags(env, pi1->Flags));
                break;
            }
        case 2:
            {
                _PRINTER_INFO_2W *pi2 = ((_PRINTER_INFO_2W *)buf.data()) + u;
                SETSTRMAYBE(obj, "serverName", pi2->pServerName);
                SETSTRMAYBE(obj, "printerName", pi2->pPrinterName);
                SETSTRMAYBE(obj, "shareName", pi2->pShareName);
                SETSTRMAYBE(obj, "portName", pi2->pPortName);
                SETSTRMAYBE(obj, "driverName", pi2->pDriverName);
                SETSTRMAYBE(obj, "comment", pi2->pComment);
                SETSTRMAYBE(obj, "location", pi2->pLocation);
                // NEEDSWORK pDevMode
                SETSTRMAYBE(obj, "sepFile", pi2->pSepFile);
                SETSTRMAYBE(obj, "printProcessor", pi2->pPrintProcessor);
                SETSTRMAYBE(obj, "datatype", pi2->pDatatype);
                SETSTRMAYBE(obj, "parameters", pi2->pParameters);
                obj.Set("attributes", enumPrinterFlags(env, pi2->Attributes));
                SET2(obj, "priority", (uint32_t)pi2->Priority);
                SET2(obj, "defaultPriority", (uint32_t)pi2->DefaultPriority);
                SET2(obj, "startTime", (uint32_t)pi2->StartTime);
                SET2(obj, "untilTime", (uint32_t)pi2->UntilTime);
                SET2(obj, "status", (uint32_t)pi2->Status);
                SET2(obj, "cJobs", (uint32_t)pi2->cJobs);
                SET2(obj, "averagePPM", (uint32_t)pi2->AveragePPM);
                break;
            }
        case 5:
            printf("level not yet supported\n");
            break;

        case 4:
            {
                _PRINTER_INFO_4W *pi4 = ((_PRINTER_INFO_4W *)buf.data()) + u;
                SETSTRMAYBE(obj, "printerName", pi4->pPrinterName);
                SETSTRMAYBE(obj, "serverName", pi4->pServerName);
                obj.Set("attributes", enumPrinterAttributes(env, pi4->Attributes));
                break;
            }
        }
        a.Set(u, obj);
    }
    // DEVNAMES *data = (DEVNAMES *)node::Buffer::Data(devnamesBuffer);
    // WCHAR *driver, *device, *output;
    // parse_devnames(data, &driver, &device, &output);
    // Local<String> driverString = Nan::New((const uint16_t *)driver, lstrlenW(driver)).ToLocalChecked();
    // Local<String> deviceString = Nan::New((const uint16_t *)device, lstrlenW(device)).ToLocalChecked();
    // Local<String> outputString = Nan::New((const uint16_t *)output, lstrlenW(output)).ToLocalChecked();
    // Napi::Object obj = Napi::Object::New(env);;
    // obj->Set(Nan::New("driver").ToLocalChecked(), driverString);
    // obj->Set(Nan::New("device").ToLocalChecked(), deviceString);
    // obj->Set(Nan::New("output").ToLocalChecked(), outputString);
    return a;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    if( !initWindowClass() ){
        throw Napi::Error::New(env, "initWindowClass failed");
    }
#define F(n)    exports.Set(#n, Napi::Function::New(env, (n)))
    F(createWindow);
    F(disposeWindow);
    F(getDc);
    F(releaseDc);
    F(measureText);
    F(createFont);
    F(deleteObject);
    F(getDpiOfHdc);
    F(printerDialog);
    F(parseDevmode);
    F(parseDevnames);
    F(createDc);
    F(createDc2);
    F(deleteDc);
    F(beginPrint);
    F(endPrint);
    F(abortPrint);
    F(startPage);
    F(endPage);
    F(moveTo);
    F(lineTo);
    F(textOut);
    F(selectObject);
    F(setTextColor);
    F(createPen);
    F(setBkMode);
    F(setTextAlign);
    F(getTextAlign);
    F(enumPrinters);
    F(enumFonts);
#undef F
#define C(n)    exports.Set(#n, n)
#define C2(n, v)    exports.Set(#n, v)
    C2(bkModeOpaque, OPAQUE);
    C2(bkModeTransparent, TRANSPARENT);
    C(FW_DONTCARE);
    C(FW_BOLD);
    C(TA_TOP);
    C(TA_BOTTOM);
    C(TA_BASELINE);
    C(TA_LEFT);
    C(TA_RIGHT);
    C(TA_CENTER);
    C(PRINTER_ENUM_LOCAL);
    C(PRINTER_ENUM_NAME);
    C(PRINTER_ENUM_SHARED);
    C(PRINTER_ENUM_CONNECTIONS);
    C(PRINTER_ENUM_NETWORK);
    C(PRINTER_ENUM_REMOTE);
    C(DMORIENT_LANDSCAPE);
    C(DMORIENT_PORTRAIT);
    C(DMPAPER_LETTER);
    C(DMPAPER_LEGAL);
    C(DMPAPER_A4);
    C(DMDUP_SIMPLEX);
    C(DMDUP_HORIZONTAL);
    C(DMDUP_VERTICAL);
#undef C
#undef C2
    return exports;
}

NODE_API_MODULE(drawer, Init)
