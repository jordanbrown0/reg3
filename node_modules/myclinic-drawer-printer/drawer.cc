#include <nan.h>

using namespace v8;

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

void createWindow(const Nan::FunctionCallbackInfo<Value>& args){
	// createWidnow()
	HWND hwnd = create_window();
	if( hwnd == NULL ){
		printf("%d\n", GetLastError());
		Nan::ThrowTypeError("create_window failed");
		return;
	}
	args.GetReturnValue().Set(Nan::New((int)hwnd));
}

void disposeWindow(const Nan::FunctionCallbackInfo<Value>& args){
	// disposeWindow(hwnd)
	if( args.Length() < 1 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}
	if( !args[0]->IsInt32() ){
		Nan::ThrowTypeError("disposeWindows: wrong argument");
		return;
	}
	HWND hwnd = (HWND)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	BOOL ok = dispose_window(hwnd);
	args.GetReturnValue().Set(Nan::New(ok));
}

void getDc(const Nan::FunctionCallbackInfo<Value>& args){
	// getDc(hwnd)
	if( args.Length() < 1 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}
	if( !args[0]->IsInt32() ){
		Nan::ThrowTypeError("getDC: wrong argument");
		return;
	}
	HWND hwnd = (HWND)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	HDC hdc = GetDC(hwnd);
	args.GetReturnValue().Set(Nan::New((int)hdc));
}

void releaseDc(const Nan::FunctionCallbackInfo<Value>& args){
	// releaseDc(hwnd, hdc)
	if( args.Length() < 2 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}
	if( !args[0]->IsInt32() || !args[1]->IsInt32() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	HWND hwnd = (HWND)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	HDC hdc = (HDC)args[1]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	BOOL ok = ReleaseDC(hwnd, hdc);
	args.GetReturnValue().Set(Nan::New(ok));
}

void measureText(const Nan::FunctionCallbackInfo<Value>& args){
	// measureText(hdc, string) => { cx:..., cy:... }
	if( args.Length() != 2 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}
	if( !args[0]->IsInt32() ){
		Nan::ThrowTypeError("wrong type for hdc");
		return;
	}
	if( !args[1]->IsString() ){
		Nan::ThrowTypeError("wrong type for string");
		return;
	}
	HDC hdc = (HDC)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	String::Value textValue(args[1]);
	SIZE mes;
	BOOL ok = GetTextExtentPoint32W(hdc, (LPCWSTR)*textValue, textValue.length(), &mes);
	if( !ok ){
		Nan::ThrowTypeError("GetTextExtentPoint32W failed");
		return;
	}
	Local<Object> obj = Nan::New<Object>();
	obj->Set(Nan::New("cx").ToLocalChecked(), Nan::New(mes.cx));
	obj->Set(Nan::New("cy").ToLocalChecked(), Nan::New(mes.cy));
	args.GetReturnValue().Set(obj);
}

void createFont(const Nan::FunctionCallbackInfo<Value>& args){
	// createFont(fontname, size, weight?, italic?) ==> HANDLE
	if( args.Length() < 2 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}
	if( !args[0]->IsString() ){
		Nan::ThrowTypeError("invalid font name");
		return;
	}
	if( !args[1]->IsInt32() ){
		Nan::ThrowTypeError("invalid font size");
		return;
	}
	if( args.Length() >= 3 && !args[2]->IsInt32() ){
		Nan::ThrowTypeError("invalid font weight");
		return;
	}
	if( args.Length() >= 4 && !args[3]->IsInt32() ){
		Nan::ThrowTypeError("invalid font italic");
		return;
	}
	String::Value fontName(args[0]);
	long size = args[1]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	long weight = args.Length() >= 3 ? args[2]->Int32Value(Nan::GetCurrentContext()).ToChecked() : 0;
	long italic = args.Length() >= 4 ? args[3]->Int32Value(Nan::GetCurrentContext()).ToChecked() : 0;
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
	if( wcscpy_s(logfont.lfFaceName, LF_FACESIZE, (const wchar_t *)*fontName) != 0 ){
		Nan::ThrowTypeError("Too long font name");
		return;
	}
	HFONT font = CreateFontIndirectW(&logfont);
	args.GetReturnValue().Set(Nan::New((int)(UINT_PTR)font));
}

void deleteObject(const Nan::FunctionCallbackInfo<Value>& args){
	// deleteObject(obj)
	if( args.Length() < 1 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32() ){
		Nan::ThrowTypeError("wrong argument");
		return;
	}
	HANDLE object = (HANDLE)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	BOOL ok = DeleteObject(object);
	args.GetReturnValue().Set(ok);
}

void getDpiOfHdc(const Nan::FunctionCallbackInfo<Value>& args){
	// getDpiOfHdc(hdc)
	if( args.Length() < 1 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	HDC hdc = (HDC)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	int dpix = GetDeviceCaps(hdc, LOGPIXELSX);
	int dpiy = GetDeviceCaps(hdc, LOGPIXELSY);
	int horzres = GetDeviceCaps(hdc, HORZRES);
	int vertres = GetDeviceCaps(hdc, VERTRES);
	Local<Object> obj = Nan::New<v8::Object>();
	obj->Set(Nan::New("dpix").ToLocalChecked(), Nan::New(dpix));
	obj->Set(Nan::New("dpiy").ToLocalChecked(), Nan::New(dpiy));
	obj->Set(Nan::New("horzres").ToLocalChecked(), Nan::New(horzres));
	obj->Set(Nan::New("vertres").ToLocalChecked(), Nan::New(vertres));
	args.GetReturnValue().Set(obj);
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

void printerDialog(const Nan::FunctionCallbackInfo<Value>& args){
	// printerDialog(devmode?, devnames?)
	HWND hwnd = create_window();
	if( hwnd == NULL ){
		Nan::ThrowTypeError("create_window failed");
		return;
	}
	DEVMODEW *devmodePtr = NULL;
	int devmodeLength = 0;
	DEVNAMES *devnamesPtr = NULL;
	int devnamesLength = 0;
	if( args.Length() >= 1 ){
		if( !args[0]->IsObject() ){
			Nan::ThrowTypeError("wrong arguments");
			return;
		}
		Local<Object> obj = args[0]->ToObject(Nan::GetCurrentContext()).ToLocalChecked();
		devmodePtr = (DEVMODEW *)node::Buffer::Data(obj);
		devmodeLength = node::Buffer::Length(obj);
	}
	if( args.Length() >= 2 ){
		if( !args[1]->IsObject() ){
			Nan::ThrowTypeError("wrong arguments");
			return;
		}
		Local<Object> obj = args[1]->ToObject(Nan::GetCurrentContext()).ToLocalChecked();
		devnamesPtr = (DEVNAMES *)node::Buffer::Data(obj);
		devnamesLength = node::Buffer::Length(obj);
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
		DEVMODEW *devmodePtr = (DEVMODEW *)GlobalLock(pd.hDevMode);
		int devmodeLength = sizeof(DEVMODEW) + devmodePtr->dmDriverExtra;
		Local<Object> devmodeBuffer = Nan::CopyBuffer((char *)devmodePtr, devmodeLength).ToLocalChecked();
		GlobalUnlock(pd.hDevMode);
		GlobalFree(pd.hDevMode);
		DEVNAMES *devnamesPtr = (DEVNAMES *)GlobalLock(pd.hDevNames);
		WCHAR *outputPtr = ((WCHAR *)devnamesPtr) + devnamesPtr->wOutputOffset;
		int outputLen = wcslen(outputPtr);
		int devnamesLength = (devnamesPtr->wOutputOffset + outputLen + 1) * 2;
		Local<Object> devnamesBuffer = Nan::CopyBuffer((char *)devnamesPtr, devnamesLength).ToLocalChecked();
		GlobalUnlock(pd.hDevNames);
		GlobalFree(pd.hDevNames);
		Local<Object> obj = Nan::New<v8::Object>();
		obj->Set(Nan::New("devmode").ToLocalChecked(), devmodeBuffer);
		obj->Set(Nan::New("devnames").ToLocalChecked(), devnamesBuffer);
		args.GetReturnValue().Set(obj);
	} else {
		args.GetReturnValue().Set(false);
	}
}

void parseDevmode(const Nan::FunctionCallbackInfo<Value>& args){
	// parseDevmode(devmode)
	if( args.Length() < 1 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsObject() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	Local<Object> devmodeBuffer = args[0]->ToObject(Nan::GetCurrentContext()).ToLocalChecked();
	DEVMODEW *devmodePtr = (DEVMODEW *)node::Buffer::Data(devmodeBuffer);
	DWORD fields = devmodePtr->dmFields;
	const uint16_t *cDevName = (const uint16_t *)devmodePtr->dmDeviceName;
	Local<String> deviceName = Nan::New(cDevName, lstrlenW((LPCWSTR)cDevName)).ToLocalChecked();
	Local<Object> obj = Nan::New<v8::Object>();
	obj->Set(Nan::New("deviceName").ToLocalChecked(), deviceName);
	obj->Set(Nan::New("orientation").ToLocalChecked(), Nan::New(devmodePtr->dmOrientation));
	obj->Set(Nan::New("paperSize").ToLocalChecked(), Nan::New(devmodePtr->dmPaperSize));
	obj->Set(Nan::New("copies").ToLocalChecked(), Nan::New(devmodePtr->dmCopies));
	obj->Set(Nan::New("printQuality").ToLocalChecked(), Nan::New(devmodePtr->dmPrintQuality));
	obj->Set(Nan::New("defaultSource").ToLocalChecked(), Nan::New(devmodePtr->dmDefaultSource));
	args.GetReturnValue().Set(obj);
}

void parseDevnames(const Nan::FunctionCallbackInfo<Value>& args){
	// parseDevnames(devnames)
	if( args.Length() < 1 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsObject() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	Local<Object> devnamesBuffer = args[0]->ToObject(Nan::GetCurrentContext()).ToLocalChecked();
	DEVNAMES *data = (DEVNAMES *)node::Buffer::Data(devnamesBuffer);
	WCHAR *driver, *device, *output;
	parse_devnames(data, &driver, &device, &output);
	Local<String> driverString = Nan::New((const uint16_t *)driver, lstrlenW(driver)).ToLocalChecked();
	Local<String> deviceString = Nan::New((const uint16_t *)device, lstrlenW(device)).ToLocalChecked();
	Local<String> outputString = Nan::New((const uint16_t *)output, lstrlenW(output)).ToLocalChecked();
	Local<Object> obj = Nan::New<v8::Object>();
	obj->Set(Nan::New("driver").ToLocalChecked(), driverString);
	obj->Set(Nan::New("device").ToLocalChecked(), deviceString);
	obj->Set(Nan::New("output").ToLocalChecked(), outputString);
	args.GetReturnValue().Set(obj);
}

void createDc(const Nan::FunctionCallbackInfo<Value>& args){
	// createDc(devmode, devnames)
	if( args.Length() < 2 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsObject() || !args[1]->IsObject() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	DEVMODEW *devmodePtr = (DEVMODEW *)node::Buffer::Data(args[0]->ToObject(Nan::GetCurrentContext()).ToLocalChecked());
	DEVNAMES *devnamesPtr = (DEVNAMES *)node::Buffer::Data(args[1]->ToObject(Nan::GetCurrentContext()).ToLocalChecked());
	WCHAR *driver, *device, *output;
	parse_devnames(devnamesPtr, &driver, &device, &output);
	HDC hdc = CreateDCW(driver, device, NULL, devmodePtr);
	if( hdc == NULL ){
		Nan::ThrowTypeError("createDC failed");
		return;
	}
	args.GetReturnValue().Set(Nan::New((int)hdc));
}

void createDc2(const Nan::FunctionCallbackInfo<Value>& args) {
	// createDC(params)
	if( args.Length() < 1 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsObject()){
		Nan::ThrowTypeError("wrong argument");
		return;
	}
	Local<Object> params = args[0]->ToObject(Nan::GetCurrentContext()).ToLocalChecked();
	Local<Value> device_val = params->Get(Nan::New("device").ToLocalChecked());
	String::Value device(device_val);
	HDC hdc = CreateDCW(NULL, (LPCWSTR)*device, NULL, NULL);
	if (hdc == NULL) {
		Nan::ThrowTypeError("createDC failed");
	}
	args.GetReturnValue().Set(Nan::New((int)hdc));
	
}
void deleteDc(const Nan::FunctionCallbackInfo<Value>& args){
	// deleteDc(hdc)
	if( args.Length() < 1 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	HDC hdc = (HDC)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	BOOL ok = DeleteDC(hdc);
	args.GetReturnValue().Set(ok);
}

void beginPrint(const Nan::FunctionCallbackInfo<Value>& args){
	// beginPrint(hdc)
	if( args.Length() < 1 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	HDC hdc = (HDC)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	DOCINFOW docinfo;
	ZeroMemory(&docinfo, sizeof(docinfo));
	docinfo.cbSize = sizeof(docinfo);
	docinfo.lpszDocName = L"drawer printing";
	int ret = StartDocW(hdc, &docinfo);
	if( ret <= 0 ){
		Nan::ThrowTypeError("StartDoc failed");
		return;
	}
	args.GetReturnValue().Set(ret);
}

void endPrint(const Nan::FunctionCallbackInfo<Value>& args){
	// endPrint(hdc)
	if( args.Length() < 1 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	HDC hdc = (HDC)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	int ret = EndDoc(hdc);
	if( ret <= 0 ){
		Nan::ThrowTypeError("EndDoc failed");
		return;
	}
	args.GetReturnValue().Set(ret);
}

void abortPrint(const Nan::FunctionCallbackInfo<Value>& args){
	// abortPrint(hdc)
	if( args.Length() < 1 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	HDC hdc = (HDC)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	int ret = AbortDoc(hdc);
	if( ret <= 0 ){
		Nan::ThrowTypeError("AbortDoc failed");
		return;
	}
	args.GetReturnValue().Set(ret);
}

void startPage(const Nan::FunctionCallbackInfo<Value>& args){
	// startPage(hdc)
	if( args.Length() < 1 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	HDC hdc = (HDC)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	int ret = StartPage(hdc);
	if( ret <= 0 ){
		Nan::ThrowTypeError("StartPage failed");
		return;
	}
	args.GetReturnValue().Set(ret);
}

void endPage(const Nan::FunctionCallbackInfo<Value>& args){
	// endPage(hdc)
	if( args.Length() < 1 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	HDC hdc = (HDC)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	int ret = EndPage(hdc);
	if( ret <= 0 ){
		Nan::ThrowTypeError("EndPage failed");
		return;
	}
	args.GetReturnValue().Set(ret);
}

void moveTo(const Nan::FunctionCallbackInfo<Value>& args){
	// moveTo(hdc, x, y)
	if( args.Length() < 3 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32() || !args[1]->IsInt32() || !args[2]->IsInt32() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	HDC hdc = (HDC)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	long x = args[1]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	long y = args[2]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	BOOL ok = MoveToEx(hdc, x, y, NULL);
	if( !ok ){
		Nan::ThrowTypeError("MoveToEx failed");
		return;
	}
	args.GetReturnValue().Set(ok);
}

void lineTo(const Nan::FunctionCallbackInfo<Value>& args){
	// lineTo(hdc, x, y)
	if( args.Length() < 3 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32() || !args[1]->IsInt32() || !args[2]->IsInt32() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	HDC hdc = (HDC)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	long x = args[1]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	long y = args[2]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	BOOL ok = LineTo(hdc, x, y);
	if( !ok ){
		Nan::ThrowTypeError("LineTo failed");
		return;
	}
	args.GetReturnValue().Set(ok);
}

void textOut(const Nan::FunctionCallbackInfo<Value>& args){
	// textOut(hdc, x, y, text)
	if( args.Length() < 4 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32() || !args[1]->IsInt32() || !args[2]->IsInt32() || !args[3]->IsString() ){
		Nan::ThrowTypeError("textOut: wrong arguments");
		return;
	}
	HDC hdc = (HDC)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	long x = args[1]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	long y = args[2]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	String::Value textValue(args[3]);
	
	BOOL ok = TextOutW(hdc, x, y, (LPWSTR)*textValue, textValue.length());
	if( !ok ){
		Nan::ThrowTypeError("TextOutW failed");
		return;
	}
	args.GetReturnValue().Set(ok);
}

void selectObject(const Nan::FunctionCallbackInfo<Value>& args){
	// selectObject(hdc, handle)
	if( args.Length() < 2 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32() || !args[1]->IsInt32() ){
		Nan::ThrowTypeError("selectObject: wrong arguments");
		return;
	}
	HDC hdc = (HDC)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	HANDLE obj = (HANDLE)args[1]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	HANDLE prev = SelectObject(hdc, obj);
	if( prev == NULL || prev == HGDI_ERROR ){
		Nan::ThrowTypeError("SelectObject failed");
		return;
	}
	args.GetReturnValue().Set((int)prev);
}

void setTextColor(const Nan::FunctionCallbackInfo<Value>& args){
	// setTextColor(hdc, r, g, b)
	if( args.Length() < 4 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32() || !args[1]->IsInt32() || !args[2]->IsInt32() || !args[3]->IsInt32() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	HDC hdc = (HDC)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	long r = args[1]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	long g = args[2]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	long b = args[3]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	COLORREF ret = SetTextColor(hdc, RGB(r, g, b));
	if( ret == CLR_INVALID ){
		Nan::ThrowTypeError("SetTextColor failed");
		return;
	}
	args.GetReturnValue().Set(TRUE);
}

void createPen(const Nan::FunctionCallbackInfo<Value>& args){
	// createPen(width, r, g, b)
	if( args.Length() < 4 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32() || !args[1]->IsInt32() || !args[2]->IsInt32() || !args[3]->IsInt32() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	long width = args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	long r = args[1]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	long g = args[2]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	long b = args[3]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	HPEN pen = CreatePen(PS_SOLID, width, RGB(r, g, b));
	if( pen == NULL ){
		Nan::ThrowTypeError("CreatePen failed");
		return;
	}
	args.GetReturnValue().Set((int)pen);
}

void setBkMode(const Nan::FunctionCallbackInfo<Value>& args){
	// setBkMode(hdc, mode)
	if( args.Length() < 2 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32() || !args[1]->IsInt32() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	HDC hdc = (HDC)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	int mode = args[1]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	int prev = SetBkMode(hdc, mode);
	if( prev == 0 ){
		Nan::ThrowTypeError("SetBkMode failed");
		return;
	}
	args.GetReturnValue().Set(prev);
}

void setTextAlign(const Nan::FunctionCallbackInfo<Value>& args){
	// setTextAlign(hdc, align)
	if( args.Length() < 2 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32() || !args[1]->IsInt32() ){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	HDC hdc = (HDC)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	int align = args[1]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	int prev = SetTextAlign(hdc, align);
	if( prev == GDI_ERROR ){
		Nan::ThrowTypeError("SetTextAlign failed");
		return;
	}
	args.GetReturnValue().Set(prev);
}

void getTextAlign(const Nan::FunctionCallbackInfo<Value>& args){
	// getTextAlign(hdc)
	if( args.Length() != 1 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	
	if( !args[0]->IsInt32()){
		Nan::ThrowTypeError("wrong arguments");
		return;
	}
	HDC hdc = (HDC)args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	int align = GetTextAlign(hdc);
	if( align == GDI_ERROR ){
		Nan::ThrowTypeError("GetTextAlign failed");
		return;
	}
	args.GetReturnValue().Set(align);
}

#define SET(obj, name, val) Nan::Set(obj, Nan::New(name).ToLocalChecked(), \
	Nan::New(val).ToLocalChecked())
#define SET2(obj, name, val) Nan::Set(obj, Nan::New(name).ToLocalChecked(), Nan::New(val))
#define SETSTRMAYBE(obj, name, val) do { 													\
		if (val != NULL) {																	\
			Nan::Set(obj, Nan::New(name).ToLocalChecked(), Nan::New(val).ToLocalChecked());	\
		}																					\
	} while(0)

Local<Object> enumPrinterAttributes(DWORD attrs) {
	Local<Object> obj = Nan::New<v8::Object>();
#define	A(sym)	do {															\
		if (attrs & PRINTER_ATTRIBUTE_##sym) {									\
			SET2(obj, #sym, true);												\
		}																		\
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

Local<Object> enumPrinterFlags(DWORD attrs) {
	Local<Object> obj = Nan::New<v8::Object>();
#define	F(sym)	do {															\
		if (attrs & PRINTER_ENUM_##sym) {									\
			SET2(obj, #sym, true);												\
		}																		\
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

void enumPrinters(const Nan::FunctionCallbackInfo<Value>& args){
	// parseDevnames(devnames)
	if( args.Length() != 3 ){
		Nan::ThrowTypeError("wrong number of arguments");
		return;
	}	

	if( !args[0]->IsInt32() ){
		Nan::ThrowTypeError("wrong type for flags");
		return;
	}
	int flags = args[0]->Int32Value(Nan::GetCurrentContext()).ToChecked();

	// NEEDSWORK:  This convers null into a string, which we then
	// ignore.  It would be better to never create the String::Value
	// if the argument is null, but I don't see how to do that and
	// keep the String::Value (if initialized) in scope.
	// Well, without using "new" to create one, but I don't want to
	// have to mess around with memory management.
	String::Value nameparam(args[1]);
	LPWSTR lpwName;
	if (args[1]->IsNull()) {
		lpwName = NULL;
	} else if(args[1]->IsString() ){
		lpwName = (LPWSTR)*nameparam;
	} else {
		Nan::ThrowTypeError("wrong type for name");
		return;
	}
	
	if( !args[2]->IsInt32() ){
		Nan::ThrowTypeError("wrong type for level");
		return;
	}
	int level = args[2]->Int32Value(Nan::GetCurrentContext()).ToChecked();
	if (level != 1 && level != 2 && level != 4 && level != 5) {
		Nan::ThrowTypeError("level must be 1, 2, 4, or 5");
		return;
	}

	DWORD needed;
	DWORD returned;
	if (!EnumPrintersW(flags, lpwName, level, NULL, 0, &needed, &returned)
		&& GetLastError() != ERROR_INSUFFICIENT_BUFFER) {
		printf("error = 0x%x\n", GetLastError());
		Nan::ThrowTypeError("First EnumPrinters failed");
		return;	
	}
	std::vector<BYTE> buf(needed);
	if (!EnumPrintersW(flags, lpwName, level, buf.data(), needed, &needed, &returned)) {
		Nan::ThrowTypeError("Second EnumPrinters failed");
		return;	
	}

	Local<Array> a = Nan::New<v8::Array>(returned);
	for (unsigned int u = 0; u < returned; u++) {
		Local<Object> obj = Nan::New<v8::Object>();
		switch(level) {
		case 1:
			{
				_PRINTER_INFO_1W *pi1 = ((_PRINTER_INFO_1W *)buf.data()) + u;
				SET(obj, "description", (const uint16_t *)pi1->pDescription);
				SET(obj, "name", (const uint16_t *)pi1->pName);
				SETSTRMAYBE(obj, "comment", (const uint16_t *)pi1->pComment);
				Nan::Set(obj, Nan::New("flags").ToLocalChecked(), enumPrinterFlags(pi1->Flags));
				break;
			}
		case 2:
			{
				_PRINTER_INFO_2W *pi2 = ((_PRINTER_INFO_2W *)buf.data()) + u;
				SETSTRMAYBE(obj, "serverName", (const uint16_t *)pi2->pServerName);
				SETSTRMAYBE(obj, "printerName", (const uint16_t *)pi2->pPrinterName);
				SETSTRMAYBE(obj, "shareName", (const uint16_t *)pi2->pShareName);
				SETSTRMAYBE(obj, "portName", (const uint16_t *)pi2->pPortName);
				SETSTRMAYBE(obj, "driverName", (const uint16_t *)pi2->pDriverName);
				SETSTRMAYBE(obj, "comment", (const uint16_t *)pi2->pComment);
				SETSTRMAYBE(obj, "location", (const uint16_t *)pi2->pLocation);
				// NEEDSWORK pDevMode
				SETSTRMAYBE(obj, "sepFile", (const uint16_t *)pi2->pSepFile);
				SETSTRMAYBE(obj, "printProcessor", (const uint16_t *)pi2->pPrintProcessor);
				SETSTRMAYBE(obj, "datatype", (const uint16_t *)pi2->pDatatype);
				SETSTRMAYBE(obj, "parameters", (const uint16_t *)pi2->pParameters);
				Nan::Set(obj, Nan::New("attributes").ToLocalChecked(),
					enumPrinterFlags(pi2->Attributes));
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
				SET(obj, "printerName", (const uint16_t *)pi4->pPrinterName);
				if (pi4->pServerName != NULL) {
					SET(obj, "serverName", (const uint16_t *)pi4->pServerName);
				}
				Nan::Set(obj, Nan::New("attributes").ToLocalChecked(),
					enumPrinterAttributes(pi4->Attributes));
				break;
			}
		}
		Nan::Set(a, u, obj);
	}
	// DEVNAMES *data = (DEVNAMES *)node::Buffer::Data(devnamesBuffer);
	// WCHAR *driver, *device, *output;
	// parse_devnames(data, &driver, &device, &output);
	// Local<String> driverString = Nan::New((const uint16_t *)driver, lstrlenW(driver)).ToLocalChecked();
	// Local<String> deviceString = Nan::New((const uint16_t *)device, lstrlenW(device)).ToLocalChecked();
	// Local<String> outputString = Nan::New((const uint16_t *)output, lstrlenW(output)).ToLocalChecked();
	// Local<Object> obj = Nan::New<v8::Object>();
	// obj->Set(Nan::New("driver").ToLocalChecked(), driverString);
	// obj->Set(Nan::New("device").ToLocalChecked(), deviceString);
	// obj->Set(Nan::New("output").ToLocalChecked(), outputString);
	args.GetReturnValue().Set(a);
}

void Init(v8::Local<v8::Object> exports){
	if( !initWindowClass() ){
		Nan::ThrowTypeError("initWindowClass failed");
		return;
	}
	exports->Set(Nan::New("createWindow").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(createWindow)->GetFunction());
	exports->Set(Nan::New("disposeWindow").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(disposeWindow)->GetFunction());
	exports->Set(Nan::New("getDc").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(getDc)->GetFunction());
	exports->Set(Nan::New("releaseDc").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(releaseDc)->GetFunction());
	exports->Set(Nan::New("measureText").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(measureText)->GetFunction());
	exports->Set(Nan::New("createFont").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(createFont)->GetFunction());
	exports->Set(Nan::New("deleteObject").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(deleteObject)->GetFunction());
	exports->Set(Nan::New("getDpiOfHdc").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(getDpiOfHdc)->GetFunction());
	exports->Set(Nan::New("printerDialog").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(printerDialog)->GetFunction());
	exports->Set(Nan::New("parseDevmode").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(parseDevmode)->GetFunction());
	exports->Set(Nan::New("parseDevnames").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(parseDevnames)->GetFunction());
	exports->Set(Nan::New("createDc").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(createDc)->GetFunction());
	exports->Set(Nan::New("createDc2").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(createDc2)->GetFunction());
	exports->Set(Nan::New("deleteDc").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(deleteDc)->GetFunction());
	exports->Set(Nan::New("beginPrint").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(beginPrint)->GetFunction());
	exports->Set(Nan::New("endPrint").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(endPrint)->GetFunction());
	exports->Set(Nan::New("abortPrint").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(abortPrint)->GetFunction());
	exports->Set(Nan::New("startPage").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(startPage)->GetFunction());
	exports->Set(Nan::New("endPage").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(endPage)->GetFunction());
	exports->Set(Nan::New("moveTo").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(moveTo)->GetFunction());
	exports->Set(Nan::New("lineTo").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(lineTo)->GetFunction());
	exports->Set(Nan::New("textOut").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(textOut)->GetFunction());
	exports->Set(Nan::New("selectObject").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(selectObject)->GetFunction());
	exports->Set(Nan::New("setTextColor").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(setTextColor)->GetFunction());
	exports->Set(Nan::New("createPen").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(createPen)->GetFunction());
	exports->Set(Nan::New("setBkMode").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(setBkMode)->GetFunction());
	exports->Set(Nan::New("setTextAlign").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(setTextAlign)->GetFunction());
	exports->Set(Nan::New("getTextAlign").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(getTextAlign)->GetFunction());
	exports->Set(Nan::New("enumPrinters").ToLocalChecked(),
			Nan::New<v8::FunctionTemplate>(enumPrinters)->GetFunction());
	exports->Set(Nan::New("bkModeOpaque").ToLocalChecked(), Nan::New(OPAQUE));
	exports->Set(Nan::New("bkModeTransparent").ToLocalChecked(), Nan::New(TRANSPARENT));
	exports->Set(Nan::New("FW_DONTCARE").ToLocalChecked(), Nan::New(FW_DONTCARE));
	exports->Set(Nan::New("FW_BOLD").ToLocalChecked(), Nan::New(FW_BOLD));
	exports->Set(Nan::New("TA_TOP").ToLocalChecked(), Nan::New(TA_TOP));
	exports->Set(Nan::New("TA_BOTTOM").ToLocalChecked(), Nan::New(TA_BOTTOM));
	exports->Set(Nan::New("TA_BASELINE").ToLocalChecked(), Nan::New(TA_BASELINE));
	exports->Set(Nan::New("TA_LEFT").ToLocalChecked(), Nan::New(TA_LEFT));
	exports->Set(Nan::New("TA_RIGHT").ToLocalChecked(), Nan::New(TA_RIGHT));
	exports->Set(Nan::New("TA_CENTER").ToLocalChecked(), Nan::New(TA_CENTER));
	exports->Set(Nan::New("PRINTER_ENUM_LOCAL").ToLocalChecked(), Nan::New(PRINTER_ENUM_LOCAL));
	exports->Set(Nan::New("PRINTER_ENUM_NAME").ToLocalChecked(), Nan::New(PRINTER_ENUM_NAME));
	exports->Set(Nan::New("PRINTER_ENUM_SHARED").ToLocalChecked(), Nan::New(PRINTER_ENUM_SHARED));
	exports->Set(Nan::New("PRINTER_ENUM_CONNECTIONS").ToLocalChecked(), Nan::New(PRINTER_ENUM_CONNECTIONS));
	exports->Set(Nan::New("PRINTER_ENUM_NETWORK").ToLocalChecked(), Nan::New(PRINTER_ENUM_NETWORK));
	exports->Set(Nan::New("PRINTER_ENUM_REMOTE").ToLocalChecked(), Nan::New(PRINTER_ENUM_REMOTE));
}

NODE_MODULE(drawer, Init)


