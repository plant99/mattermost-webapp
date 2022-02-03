// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {FormattedMessage} from 'react-intl';

import {localizeMessage, copyToClipboard} from 'utils/utils.jsx';
import LoadingImagePreview from 'components/loading_image_preview';
import Tooltip from 'components/tooltip';
import OverlayTrigger from 'components/overlay_trigger';

const MIN_IMAGE_SIZE = 48;
const MIN_IMAGE_SIZE_FOR_INTERNAL_BUTTONS = 100;

// SizeAwareImage is a component used for rendering images where the dimensions of the image are important for
// ensuring that the page is laid out correctly.
export default class SizeAwareImage extends React.PureComponent {
    static propTypes = {

        /*
         * The source URL of the image
         */
        src: PropTypes.string.isRequired,

        /*
         * dimensions object to create empty space required to prevent scroll pop
         */
        dimensions: PropTypes.object,
        fileInfo: PropTypes.object,

        /**
         * fileURL of the original image
         */
        fileURL: PropTypes.string,

        /*
         * Boolean value to pass for showing a loader when image is being loaded
         */
        showLoader: PropTypes.bool,

        /*
         * A callback that is called as soon as the image component has a height value
         */
        onImageLoaded: PropTypes.func,

        /*
         * A callback that is called when image load fails
         */
        onImageLoadFail: PropTypes.func,

        /*
         * Fetch the onClick function
         */
        onClick: PropTypes.func,

        /*
         * css classes that can added to the img as well as parent div on svg for placeholder
         */
        className: PropTypes.string,

        /*
         * Enables the logic of surrounding small images with a bigger container div for better click/tap targeting
         */
        handleSmallImageContainer: PropTypes.bool,
    }

    constructor(props) {
        super(props);
        const {dimensions} = props;

        this.state = {
            loaded: false,
            isSmallImage: this.dimensionsAvailable(dimensions) ? this.isSmallImage(
                dimensions.width, dimensions.height) : false,
            linkCopiedRecently: false,
        };

        this.heightTimeout = 0;
    }

    componentDidMount() {
        this.mounted = true;
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    dimensionsAvailable = (dimensions) => {
        return dimensions && dimensions.width && dimensions.height;
    }

    isSmallImage = (width, height) => {
        return width < MIN_IMAGE_SIZE || height < MIN_IMAGE_SIZE;
    }

    handleLoad = (event) => {
        if (this.mounted) {
            const image = event.target;
            const isSmallImage = this.isSmallImage(image.naturalWidth, image.naturalHeight);
            this.setState({
                loaded: true,
                error: false,
                isSmallImage,
                imageWidth: image.naturalWidth,
            }, () => { // Call onImageLoaded prop only after state has already been set
                if (this.props.onImageLoaded && image.naturalHeight) {
                    this.props.onImageLoaded({height: image.naturalHeight, width: image.naturalWidth});
                }
            });
        }
    };

    handleError = () => {
        if (this.mounted) {
            if (this.props.onImageLoadFail) {
                this.props.onImageLoadFail();
            }
            this.setState({error: true});
        }
    };

    handleImageClick = (e) => {
        this.props.onClick?.(e, this.props.src);
    }

    onEnterKeyDown = (e) => {
        if (e.key === 'Enter') {
            this.handleImageClick(e);
        }
    }

    renderImageLoaderIfNeeded = () => {
        if (!this.state.loaded && this.props.showLoader && !this.state.error) {
            return (
                <div style={{position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', left: '50%'}}>
                    <LoadingImagePreview
                        containerClass={'file__image-loading'}
                    />
                </div>
            );
        }
        return null;
    }

    renderImageWithContainerIfNeeded = () => {
        const {
            fileInfo,
            src,
            fileURL,
            ...props
        } = this.props;

        Reflect.deleteProperty(props, 'showLoader');
        Reflect.deleteProperty(props, 'onImageLoaded');
        Reflect.deleteProperty(props, 'onImageLoadFail');
        Reflect.deleteProperty(props, 'dimensions');
        Reflect.deleteProperty(props, 'handleSmallImageContainer');
        Reflect.deleteProperty(props, 'onClick');

        let ariaLabelImage = localizeMessage('file_attachment.thumbnail', 'file thumbnail');
        if (fileInfo) {
            ariaLabelImage += ` ${fileInfo.name}`.toLowerCase();
        }

        const image = (
            <img
                {...props}
                aria-label={ariaLabelImage}
                tabIndex='0'
                onClick={this.handleImageClick}
                onKeyDown={this.onEnterKeyDown}
                className={
                    this.props.className +
                    (this.props.handleSmallImageContainer &&
                        this.state.isSmallImage ? ' small-image--inside-container' : '')}
                src={src}
                onError={this.handleError}
                onLoad={this.handleLoad}
            />
        );

        // copyLink, download are two buttons overlayed on image preview
        // copyLinkTooltip, downloadTooltip are tooltips for the buttons respectively.
        // if linkCopiedRecently is true, defaultMessage would be 'Copy Link', else 'Copied!'

        const copyLinkTooltip = (
            <Tooltip
                id='copy-link-tooltip'
                className='hidden-xs'
            >
                <FormattedMessage
                    id='single_image_view.copy_link_tooltip'
                    defaultMessage={this.state.linkCopiedRecently ? 'Copied' : 'Copy link'}
                />
            </Tooltip>
        );
        const copyLink = (
            <OverlayTrigger
                className='hidden-xs'
                delayShow={500}
                placement='top'
                overlay={copyLinkTooltip}
                rootClose={true}
            >
                <button
                    key='copy-link'
                    className={classNames('style--none', 'size-aware-image__copy_link', {
                        'size-aware-image__copy_link--recently_copied': this.state.linkCopiedRecently,
                    })}
                    aria-label='Copy Link to Asset'
                    onClick={this.copyLinkToAsset}
                >
                    {this.state.linkCopiedRecently ? (
                        <i className='icon icon-check style--none'/>
                    ) : (
                        <i className='icon icon-link-variant style--none'/>
                    )}
                </button>
            </OverlayTrigger>
        );

        const downloadTooltip = (
            <Tooltip
                id='download-preview-tooltip'
                className='hidden-xs'
            >
                <FormattedMessage
                    id='single_image_view.download_tooltip'
                    defaultMessage='Download'
                />
            </Tooltip>
        );

        const download = (
            <OverlayTrigger
                className='hidden-xs'
                delayShow={500}
                placement='top'
                overlay={downloadTooltip}
                rootClose={true}
            >
                <a
                    href={fileURL}
                    className='style--none size-aware-image__download'
                    target='_blank'
                    rel='noopener noreferrer'
                    download={fileInfo.name}
                >
                    <i className='icon icon-download-outline style--none'/>
                </a>
            </OverlayTrigger>

        );

        if (this.props.handleSmallImageContainer && this.state.isSmallImage) {
            let className = 'small-image__container cursor--pointer a11y--active';
            if (this.state.imageWidth < MIN_IMAGE_SIZE) {
                className += ' small-image__container--min-width';
            }

            return (
                <div
                    className={classNames('small-image-utility-buttons-wrapper')}
                >
                    <div
                        onClick={this.handleImageClick}
                        className={className}
                        style={this.state.imageWidth > MIN_IMAGE_SIZE ? {
                            width: this.state.imageWidth + 2, // 2px to account for the border
                        } : {}}
                    >
                        {image}
                    </div>
                    <span
                        className={classNames('image-preview-utility-buttons-container', 'image-preview-utility-buttons-container--small-image')}
                        style={this.state.imageWidth > MIN_IMAGE_SIZE ? {

                            // for every pixel the image is wider than MIN, add that to left shift of buttons container
                            // 20px is the width of collapse button.

                            left: 26 + (this.state.imageWidth - MIN_IMAGE_SIZE),
                        } : {}}
                    >
                        {copyLink}
                        {download}
                    </span>
                </div>
            );
        }

        return (
            <figure className={classNames('image-loaded-container')}>
                {image}
                <span
                    className={classNames('image-preview-utility-buttons-container', {

                        // cases for when image isn't a small image but width is < 100px

                        'image-preview-utility-buttons-container--small-image': this.state.imageWidth < MIN_IMAGE_SIZE_FOR_INTERNAL_BUTTONS,
                    })}
                    style={this.state.imageWidth < MIN_IMAGE_SIZE_FOR_INTERNAL_BUTTONS ? {

                        // for every pixel the image is wider than MIN, add that to left shift of buttons container
                        // 20px is the width of collapse button.

                        left: 26 + (this.state.imageWidth - MIN_IMAGE_SIZE),
                    } : {}}
                >
                    {copyLink}
                    {download}
                </span>
            </figure>
        );
    }

    renderImageOrPlaceholder = () => {
        const {
            dimensions,
        } = this.props;

        let placeHolder;

        if (this.dimensionsAvailable(dimensions) && !this.state.loaded) {
            placeHolder = (
                <div
                    className={`image-loading__container ${this.props.className}`}
                    style={{maxWidth: dimensions.width}}
                >
                    {this.renderImageLoaderIfNeeded()}
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                        style={{maxHeight: dimensions.height, maxWidth: dimensions.width, verticalAlign: 'middle'}}
                    />
                </div>
            );
        }

        const shouldShowImg = !this.dimensionsAvailable(dimensions) || this.state.loaded;

        return (
            <React.Fragment>
                {placeHolder}
                <div
                    className='file-preview__button'
                    style={{display: shouldShowImg ? 'initial' : 'none'}}
                >
                    {this.renderImageWithContainerIfNeeded()}
                </div>
            </React.Fragment>
        );
    }

    copyLinkToAsset = () => {
        const fileURL = this.props.fileURL;
        copyToClipboard(fileURL ?? '');

        // set linkCopiedRecently to true, and reset to false after 4 seconds
        this.setState({linkCopiedRecently: true});
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(() => {
            this.setState({linkCopiedRecently: false});
        }, 4000);
    }

    render() {
        return (
            this.renderImageOrPlaceholder()
        );
    }
}
