// @flow

import React, { Component } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import type { Dispatch } from 'redux';

import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n';
import { Icon, IconPlane, IconSmile } from '../../../base/icons';
import { getParticipantById } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { sendMessage, setPrivateMessageRecipient } from '../../actions.any';
import {
    _mapDispatchToProps,
    _mapStateToProps
} from '../AbstractChatPrivacyDialog';

import SmileysPanel from './SmileysPanel';

/**
 * The type of the React {@code Component} props of {@link ChatInput}.
 */
type Props = {

    /**
     * Invoked to send chat messages.
     */
    dispatch: Dispatch<any>,

    /**
     * Optional callback to invoke when the chat textarea has auto-resized to
     * fit overflowing text.
     */
    onResize: ?Function,

    /**
     * Callback to invoke on message send.
     */
    onSend: Function,

    /**
     * List of participants.
     */
    participants: Object[],

    /**
     * Prop to be invoked when the user wants to set a private recipient.
     */
    _onSetMessageRecipient: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link ChatInput}.
 */
type State = {

    /**
     * User provided nickname when the input text is provided in the view.
     */
    message: string,

    /**
     * Whether or not the smiley selector is visible.
     */
    showSmileysPanel: boolean
};

/**
 * Implements a React Component for drafting and submitting a chat message.
 *
 * @extends Component
 */
class ChatInput extends Component<Props, State> {
    _textArea: ?HTMLTextAreaElement;

    state = {
        message: '',
        showSmileysPanel: false
    };

    /**
     * Initializes a new {@code ChatInput} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._textArea = null;

        // Bind event handlers so they are only bound once for every instance.
        this._onDetectSubmit = this._onDetectSubmit.bind(this);
        this._onMessageChange = this._onMessageChange.bind(this);
        this._onSmileySelect = this._onSmileySelect.bind(this);
        this._onSubmitMessage = this._onSubmitMessage.bind(this);
        this._onToggleSmileysPanel = this._onToggleSmileysPanel.bind(this);
        this._setTextAreaRef = this._setTextAreaRef.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        if (isMobileBrowser()) {
            // Ensure textarea is not focused when opening chat on mobile browser.
            this._textArea && this._textArea.blur();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const smileysPanelClassName = `${this.state.showSmileysPanel
            ? 'show-smileys' : 'hide-smileys'} smileys-panel`;

        return (
            <div className = { `chat-input-container${this.state.message.trim().length ? ' populated' : ''}` }>
                <div id = 'chat-input' >
                    <div className = 'smiley-input'>
                        <div id = 'smileysarea'>
                            <div id = 'smileys'>
                                <div
                                    className = 'smiley-button'
                                    onClick = { this._onToggleSmileysPanel }>
                                    <Icon src = { IconSmile } />
                                </div>
                            </div>
                        </div>
                        <div className = { smileysPanelClassName }>
                            <SmileysPanel
                                onSmileySelect = { this._onSmileySelect } />
                        </div>
                    </div>
                    <div className = 'usrmsg-form'>
                        <TextareaAutosize
                            id = 'usermsg'
                            inputRef = { this._setTextAreaRef }
                            maxRows = { 5 }
                            onChange = { this._onMessageChange }
                            onHeightChange = { this.props.onResize }
                            onKeyDown = { this._onDetectSubmit }
                            placeholder = { this.props.t('chat.messagebox') }
                            value = { this.state.message } />
                    </div>
                    <div className = 'send-button-container'>
                        <div
                            className = 'send-button'
                            onClick = { this._onSubmitMessage }>
                            <Icon src = { IconPlane } />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Place cursor focus on this component's text area.
     *
     * @private
     * @returns {void}
     */
    _focus() {
        this._textArea && this._textArea.focus();
    }


    _onSubmitMessage: () => void;

    /**
     * Submits the message to the chat window.
     *
     * @returns {void}
     */
    _onSubmitMessage() {
        const trimmed = this.state.message.trim();

        if (trimmed) {
            this.props.onSend(trimmed);

            this.setState({ message: '' });

            // Keep the textarea in focus when sending messages via submit button.
            this._focus();
        }

    }
    _onDetectSubmit: (Object) => void;

    /**
     * Detects if enter has been pressed. If so, submit the message in the chat
     * window.
     *
     * @param {string} event - Keyboard event.
     * @private
     * @returns {void}
     */
    _onDetectSubmit(event) {
        if (event.keyCode === 13
            && event.shiftKey === false) {
            event.preventDefault();

            this._onSubmitMessage();
        }
    }

    _onMessageChange: (Object) => void;

    /**
     * Updates the known message the user is drafting.
     *
     * @param {string} event - Keyboard event.
     * @private
     * @returns {void}
     */
    _onMessageChange(event) {
        const participantsNames = this.props.participants.map(e => e.name);
        const input = event.target.value;

        if (input.startsWith('@')) {
            let userFound = false;
            const firstWordAfterAt = input.substring(1).split(' ')[0];

            if (firstWordAfterAt === '') {
                this.setState({ message: event.target.value });

                return;
            }

            // Search partial
            for (let i = 0; i < participantsNames.length; i++) {
                const name = participantsNames[i];

                // HINTING
                if (name.includes(firstWordAfterAt)) {
                    console.log(name);
                    console.log('YAY WE ARE STILL WORTHY');

                }
            }

            // Full, set recipient
            for (let i = 0; i < participantsNames.length; i++) {
                const name = participantsNames[i];

                if (name === firstWordAfterAt) {
                    console.log(`SET PARTICIPANT: ${name}`);
                    console.log(this.props.participants.filter(e => e.name === name)[0]);
                    this.props._onSetMessageRecipient(this.props.participants.filter(e => e.name === name)[0]);
                    userFound = true;
                    break;
                }
            }
            if (!userFound) {
                this.props._onSetMessageRecipient(null);
            }
        }
        this.setState({ message: event.target.value });
    }

    _onSmileySelect: (string) => void;

    /**
     * Appends a selected smileys to the chat message draft.
     *
     * @param {string} smileyText - The value of the smiley to append to the
     * chat message.
     * @private
     * @returns {void}
     */
    _onSmileySelect(smileyText) {
        this.setState({
            message: `${this.state.message} ${smileyText}`,
            showSmileysPanel: false
        });

        this._focus();
    }

    _onToggleSmileysPanel: () => void;

    /**
     * Callback invoked to hide or show the smileys selector.
     *
     * @private
     * @returns {void}
     */
    _onToggleSmileysPanel() {
        this.setState({ showSmileysPanel: !this.state.showSmileysPanel });

        this._focus();
    }

    _setTextAreaRef: (?HTMLTextAreaElement) => void;

    /**
     * Sets the reference to the HTML TextArea.
     *
     * @param {HTMLAudioElement} textAreaElement - The HTML text area element.
     * @private
     * @returns {void}
     */
    _setTextAreaRef(textAreaElement: ?HTMLTextAreaElement) {
        this._textArea = textAreaElement;
    }

    /**
     * Maps part of the props of this component to Redux actions.
     *
     * @param {Function} dispatch - The Redux dispatch function.
     * @returns {Props}
     */
    _mapDispatchToProps(dispatch: Function): $Shape<Props> {
        return {
            _onSetMessageRecipient: participant => {
                dispatch(setPrivateMessageRecipient(participant));
            }
        };
    }

    /**
     * Maps part of the Redux store to the props of this component.
     *
     * BROKEN.
     *
     * @param {Object} state - The Redux state.
     * @param {Props} ownProps - The own props of the component.
     * @returns {Props}
     */
    _mapStateToProps(state: Object, ownProps: Props): $Shape<Props> {
        return {
            _participant: getParticipantById(state, ownProps.participantID)
        };
    }

}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(ChatInput));

