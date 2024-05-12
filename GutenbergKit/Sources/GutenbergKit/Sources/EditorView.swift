import UIKit
import SwiftUI
import WebKit
import Photos
import PhotosUI

public struct EditorView: View {
    @State private var isBlockInserterShown = true

    public init() {}

    public var body: some View {
        NavigationView {
            _EditorView()

                .toolbar {
                    ToolbarItemGroup(placement: .topBarLeading) {
                        Button(action: {}, label: {
                            Image(systemName: "xmark")
                        })
                    }
                    ToolbarItemGroup(placement: .topBarTrailing) {
                        Button(action: {}, label: {
                            Image(systemName: "arrow.uturn.backward")
                        })
                        Button(action: {}, label: {
                            Image(systemName: "arrow.uturn.forward")
                        }).disabled(true)
                        Menu {
                            Section {
                                Button(action: {}, label: {
                                    Label("Code Editor", systemImage: "curlybraces")
                                })
                                Button(action: {}, label: {
                                    Label("Outline", systemImage: "list.bullet.indent")
                                })
                                Button(action: /*@START_MENU_TOKEN@*/{}/*@END_MENU_TOKEN@*/, label: {
                                    Label("Preview", systemImage: "safari")
                                })
                            }
                            Section {
                                Button(action: /*@START_MENU_TOKEN@*/{}/*@END_MENU_TOKEN@*/, label: {
                                    Label("Revisions (42)", systemImage: "clock.arrow.circlepath")
                                })
                                Button(action: /*@START_MENU_TOKEN@*/{}/*@END_MENU_TOKEN@*/, label: {
                                    Label("Post Settings", systemImage: "gearshape")
                                })

                                Button(action: /*@START_MENU_TOKEN@*/{}/*@END_MENU_TOKEN@*/, label: {
                                    Label("Help", systemImage: "questionmark.circle")
                                })
                            }
                            Section {
                                Text("Blocks: 4, Words: 8, Characters: 15")
                            } header: {

                            }
                        } label: {
                            Image(systemName: "ellipsis")
                        }

//                        Button(action: {}, label: {
//                            Text("Publish")
//                        })
////                        .font(.headline)

//                            Button(action: {}, label: {
//                                Image(systemName: "paperplane.fill")
//                            })
//                            .font(.headline)


                        Button(action: {}, label: {
                            Image(systemName: "arrow.up.circle.fill")
                        })
                        .font(.title2)

//                        Button("Publish") {
//
//                        }
//                        .buttonStyle(.bordered)
                    }

                }

                .tint(Color.primary)
                .sheet(isPresented: $isBlockInserterShown) {
                    NavigationView {
                        BlockInserter()
                    }
                    .presentationDetents([.height(540), .large])
                    .presentationCornerRadius(20)
                }
        }
    }
}

struct _EditorView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> GutenbergViewController {
        GutenbergViewController()
    }

    func updateUIViewController(_ uiViewController: GutenbergViewController, context: Context) {
        // Do nothing
    }
}

final class GutenbergViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {
    private var reactAppURL: URL!
    private var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        reactAppURL = Bundle.module.url(forResource: "index", withExtension: "html", subdirectory: "Gutenberg")

        // The `allowFileAccessFromFileURLs` allows the web view to access the
        // files from the local filesystem.
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.setValue(true, forKey: "allowUniversalAccessFromFileURLs")

        // Set-up communications with the editor.
        config.userContentController.add(self, name: "appMessageHandler")

        // set the configuration on the `WKWebView`
        // don't worry about the frame: .zero, SwiftUI will resize the `WKWebView` to
        // fit the parent
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        self.webView = webView

        view.addSubview(webView)
        webView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        loadEditor()
    }

    private func loadEditor() {
        webView.loadFileURL(reactAppURL, allowingReadAccessTo: Bundle.main.resourceURL!)
    }

    // MARK: - WKNavigationDelegate

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        NSLog("didFailNavigation: \(error)")
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        NSLog("didFailProvisionalNavigation: \(error)")
    }

    // MARK: - WKScriptMessageHandler

    // TODO: it is a retain cycle, isn't it?
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let message = JSEditorMessage(message: message) else {
            return NSLog("Unsupported message: \(message.body)")
        }
        do {
            switch message.type {
            case .onBlocksChanged:
                let blocks = try message.decode([Block].self)
                NSLog("onBlockChanged: \(blocks)")
            }
        } catch {
            NSLog("Failed to decode message: \(error)")
        }
    }
}

struct EditorView_Preview: PreviewProvider {
    static var previews: some View {
        EditorView()
    }
}
