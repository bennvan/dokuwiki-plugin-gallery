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

}

// vim:ts=4:sw=4:et:
