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

    /**
     * Registers hooks
     */
    public function register(Doku_Event_Handler $controller) {
       $controller->register_hook('DOKUWIKI_STARTED', 'AFTER', $this, '_galleryJSINFO');
       $controller->register_hook('PLUGIN_MOVE_HANDLERS_REGISTER', 'BEFORE', $this, 'handle_move_register');
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
