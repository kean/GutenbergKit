import Foundation
import Testing

@testable import GutenbergKit

#if canImport(UIKit)

/// Pins that ``EditorViewController/stopMediaHandling()`` opens the ownership cycle a host can
/// form, and that a host which doesn't form one needs nothing.
///
/// The editor holds `mediaProcessor`/`mediaUploader` strongly, so a host that holds the
/// editor back forms a cycle ARC cannot break — and `deinit`, which does this work on
/// every other path, is exactly what a cycle prevents. `stopMediaHandling()` is the way out, and
/// it has to be the host's call — not because UIKit can't report a teardown, but because
/// it can't report whether one is permanent. A host may re-present or re-attach the same
/// editor, and this call is terminal, so guessing wrong disables media in an editor that
/// survived. See ``EditorViewController/stopMediaHandling()``.
@Suite("EditorViewController media teardown")
struct EditorViewControllerMediaTeardownTests: MakesTestFixtures {
    static let testSiteURL = URL(string: "https://test.example.com")!
    static let testApiRoot = URL(string: "https://test.example.com/wp-json/wp/v2")!

    @MainActor
    @Test("stopMediaHandling frees the editor and the host processor that owns it")
    func stopMediaHandlingBreaksTheOwnershipCycle() {
        weak var weakEditor: EditorViewController?
        weak var weakHost: EditorOwningProcessor?

        do {
            let host = EditorOwningProcessor(configuration: makeConfiguration())
            weakEditor = host.editor
            weakHost = host
            host.editor.stopMediaHandling()
        }

        #expect(weakHost == nil, "host processor leaked — stopMediaHandling did not release it")
        #expect(weakEditor == nil, "EditorViewController leaked — cycle through mediaProcessor")
    }

    @MainActor
    @Test("a host that does not retain the editor is freed without stopMediaHandling")
    func standaloneProcessorIsFreed() {
        weak var weakEditor: EditorViewController?

        do {
            let editor = EditorViewController(
                configuration: makeConfiguration(),
                mediaProcessor: StandaloneProcessor()
            )
            weakEditor = editor
        }

        #expect(weakEditor == nil)
    }
}

/// The shape that cycles: owns the editor *and* is its processor. Hosts write this
/// because the processing work needs context the owner already holds.
@MainActor
private final class EditorOwningProcessor: MediaProcessor {
    /// Implicitly unwrapped so `self` can be passed as the editor's processor: every
    /// stored property then has a value (nil) on entry to `init`, which is what makes
    /// `self` available there. Taking the processor at `init` doesn't prevent this
    /// shape — it just moves where the host writes it.
    private(set) var editor: EditorViewController!

    init(configuration: EditorConfiguration) {
        editor = EditorViewController(configuration: configuration, mediaProcessor: self)
    }

    nonisolated func handlesFile(ofType mimeType: String, named filename: String) -> Bool { false }

    nonisolated func processFile(at url: URL, mimeType: String, filename: String) async throws -> ProcessedProxyFile {
        .original
    }
}

private final class StandaloneProcessor: MediaProcessor {
    func handlesFile(ofType mimeType: String, named filename: String) -> Bool { false }

    func processFile(at url: URL, mimeType: String, filename: String) async throws -> ProcessedProxyFile {
        .original
    }
}

#endif
