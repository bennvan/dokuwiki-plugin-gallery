<?php
/**
 * DokuWiki Plugin gallery (Action Component)
 *
 * @license GPL 2 http://www.gnu.org/licenses/gpl-2.0.html
 * @author  Mark Liffiton <liffiton@gmail.com>
 */

// must be run within Dokuwiki
if (!defined('DOKU_INC')) die();

/**
 * Add scripts via an event handler
 */
class action_plugin_gallery extends DokuWiki_Action_Plugin {

    /** @var string[] Sources for nested calls to p_get_instructions(). */
    private $mediaSources = [];

    /**
     * Registers hooks
     */
    public function register(Doku_Event_Handler $controller) {
       $controller->register_hook('DOKUWIKI_STARTED', 'AFTER', $this, '_galleryJSINFO');
       $controller->register_hook('PLUGIN_MOVE_HANDLERS_REGISTER', 'BEFORE', $this, 'handle_move_register');
       if ($this->getConf('defaultDirect')) {
           $controller->register_hook('PARSER_WIKITEXT_PREPROCESS', 'AFTER', $this, 'rememberMediaSource', null, 1000);
           $controller->register_hook('PARSER_HANDLER_DONE', 'BEFORE', $this, 'defaultDirectMedia', null, -1000);
       }
    }

    public function rememberMediaSource(Doku_Event $event, $param)
    {
        // Match the parser's newline normalization and leading padding for byte offsets.
        $this->mediaSources[] = "\n" . str_replace("\r\n", "\n", $event->data) . "\n";
    }

    public function defaultDirectMedia(Doku_Event $event, $param)
    {
        $source = array_pop($this->mediaSources);
        if ($source === null) return;
        $this->applyDirectMedia($event->data->calls, $source);
    }

    private function applyDirectMedia(array &$calls, $source)
    {
        foreach ($calls as &$call) {
            if ($call[0] === 'nest') {
                $this->applyDirectMedia($call[1][0], $source);
                continue;
            }
            if ($call[0] !== 'internalmedia' || ($call[1][6] ?? '') !== 'details') continue;
            list(, $mime) = mimetype(explode('#', $call[1][0], 2)[0], false);
            if (strpos($mime, 'image/') !== 0) continue;

            // Core uses 'details' for both the default and an explicit ?detail.
            // Inspect only actual media instructions, never code examples or page text.
            $pos = $call[2];
            if ($pos < 0 || $pos >= strlen($source)) continue;
            if (preg_match('/\G[ \t]*\{\{((?:[^}]|}(?!}))*+)\}\}/', $source, $match, 0, $pos)) {
                $media = trim(explode('|', $match[1], 2)[0]);
            } elseif (preg_match('/\G[ \t]*!\[[^\[\]\n]*\]\(([^)\n]+)\)/', $source, $match, 0, $pos)) {
                // Mort's Markdown image syntax uses the same media parameters.
                $inside = trim($match[1]);
                $media = substr($inside, 0, strcspn($inside, " \t\n"));
            } else {
                continue;
            }

            $query = strrpos($media, '?');
            $src = $query === false ? $media : substr($media, 0, $query);
            $options = $query === false ? '' : substr($media, $query + 1);
            // Leave generated instructions and explicit detail requests alone.
            if ($src !== $call[1][0] || preg_match('/(?:^|&)details?(?:&|$)/i', $options)) continue;
            $call[1][6] = 'direct';
        }
        unset($call);
    }

    /**
     * Exports configuration settings to $JSINFO
     */
    public function _galleryJSINFO(Doku_Event $event, $param)
    {
        global $JSINFO;

        $JSINFO['plugin_gallery'] = array(
                'mediapaths'   => array(DOKU_BASE.'lib/exe/fetch.php?',DOKU_BASE.'_media/'),
                'jsviewerall'  => $this->getConf('jsViewerAll'),
                'jsviewer'     => $this->getConf('jsViewer'),
        );
    }

    public function handle_move_register(Doku_Event $event, $params) {
        $event->data['handlers']['gallery'] = array($this, 'rewrite_gallery_img');
    }

    public function rewrite_gallery_img($match, $state, $pos, $pluginname, helper_plugin_move_handler $handler) {
        // Only want to rewrite explicit defined images
        if ($state !== DOKU_LEXER_MATCHED) {
            return $match;
        }
        $handler->media($match, $state, $pos);
    }

}

// vim:ts=4:sw=4:et:
