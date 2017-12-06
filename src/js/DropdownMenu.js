import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import classnames from 'classnames';
import {Portal} from 'react-portal'

const TAB = 9;
const SPACEBAR = 32;
const ALIGNMENTS = ['center', 'right', 'left'];
const MENU_SIZES = ['sm', 'md', 'lg', 'xl'];

const root = document.createElement('div')
root.className = 'DropdownMenu-portal'
document.body.appendChild(root)


export default class DropdownMenu extends PureComponent {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    close: PropTypes.func.isRequired,
    toggle: PropTypes.node.isRequired,
    children: PropTypes.node,
    inverse: PropTypes.bool,
    align: PropTypes.oneOf(ALIGNMENTS),
    animAlign: PropTypes.oneOf(ALIGNMENTS),
    textAlign: PropTypes.oneOf(ALIGNMENTS),
    menuAlign: PropTypes.oneOf(ALIGNMENTS),
    className: PropTypes.string,
    size: PropTypes.oneOf(MENU_SIZES),
    upwards: PropTypes.bool,
    animate: PropTypes.bool,
    enterTimeout: PropTypes.number,
    leaveTimeout: PropTypes.number,
    closeOnInsideClick: PropTypes.bool,
    closeOnOutsideClick: PropTypes.bool,
    xOffset: PropTypes.number,
    fixed: PropTypes.bool,
    menuClassName: PropTypes.string,
  };

  static defaultProps = {
    inverse: false,
    align: 'center',
    animAlign: null,
    textAlign: null,
    menuAlign: null,
    className: null,
    size: null,
    upwards: false,
    animate: true,
    enterTimeout: 150,
    leaveTimeout: 150,
    closeOnInsideClick: true,
    closeOnOutsideClick: true,
    xOffset: 0,
    fixed: false,
  };

  state = {
    dropdownTopOffset: -10000,
    dropdownLeftOffset: -10000,
    dropdownRightOffset: 0,
    dropdownToggleComponentHeight: 0,
    dropdownToggleComponentWidth: 0,
    dropdownWidth: null,
    portalWidth: 0,
  }

  static MENU_SIZES = MENU_SIZES;
  static ALIGNMENTS = ALIGNMENTS;

  componentWillReceiveProps(nextProps) {
    if (!this.props.isOpen && nextProps.isOpen) {
      const wrapperNode = this._wrapperRef
      const {top, left, right, height, width} = wrapperNode.getBoundingClientRect()
      const portalNodeRect = nextProps.portalNode && nextProps.portalNode.getBoundingClientRect()
      this.setState({
        portalWidth: portalNodeRect ? portalNodeRect.width : window.outerWidth,
        dropdownTopOffset: ((portalNodeRect && !nextProps.fixed) ? top - portalNodeRect.top : top) + (nextProps.portalNode ? (nextProps.fixed ? 0 : nextProps.portalNode.scrollTop) : 0),
        dropdownLeftOffset: (portalNodeRect ? left - portalNodeRect.left : left) + nextProps.xOffset,
        dropdownRightOffset: portalNodeRect ? portalNodeRect.right - right : right,
        dropdownToggleComponentHeight: height,
        dropdownToggleComponentWidth: width,
      })
    }
  }

  componentDidUpdate(prevProps) {
    if(this.props.isOpen === prevProps.isOpen) {
      return;
    }

    const menuItems = ReactDOM.findDOMNode(this._portalRef).querySelector('.dd-menu-items');
    if(this.props.isOpen && !prevProps.isOpen) {
      this.lastWindowClickEvent = this.handleClickOutside;
      document.addEventListener('click', this.lastWindowClickEvent);
      if(this.props.closeOnInsideClick) {
        menuItems.addEventListener('click', this.close);
      }
      menuItems.addEventListener('onkeydown', this.handleMenuItemKeyDown);
    } else if(!this.props.isOpen && prevProps.isOpen) {
      document.removeEventListener('click', this.lastWindowClickEvent);
      if(prevProps.closeOnInsideClick) {
        menuItems.removeEventListener('click', this.close);
      }
      menuItems.removeEventListener('onkeydown', this.handleMenuItemKeyDown);

      this.lastWindowClickEvent = null;
    }
  }

  componentWillUnmount() {
    if(this.lastWindowClickEvent) {
      document.removeEventListener('click', this.lastWindowClickEvent);
    }
  }

  close = (e) => {
    // ensure eventual event handlers registered by consumers via React props are evaluated first
    setTimeout(() => this.props.close(e));
  }

  handleMenuItemKeyDown = (e) => {
    const key = e.which || e.keyCode;
    if(key === SPACEBAR) {
      this.close(e);
      e.preventDefault();
    }
  };

  handleClickOutside = (e) => {
    if(!this.props.closeOnOutsideClick) {
      return;
    }

    const node = ReactDOM.findDOMNode(this._portalRef);
    let target = e.target;

    while(target.parentNode) {
      if(target === node) {
        return;
      }

      target = target.parentNode;
    }

    this.close(e);
  };

  handleKeyDown = (e) => {
    const key = e.which || e.keyCode;
    if(key !== TAB) {
      return;
    }

    const items = ReactDOM.findDOMNode(this._portalRef).querySelectorAll('button,a');
    const id = e.shiftKey ? 1 : items.length - 1;

    if(e.target === items[id]) {
      this.close(e);
    }
  };

  _registerWrapperRef = (ref) => this._wrapperRef = ref
  _registerPortalRef = (ref) => this._portalRef = ref
  _setDropdownWidth = (width) => this.setState({dropdownWidth: width})

  render() {
    const { menuAlign, align, inverse, size, className } = this.props;
    const alignment = menuAlign || align

    const menuClassName = classnames(
      'dd-menu',
      `dd-menu-${alignment}`,
      { 'dd-menu-inverse': inverse },
      size ? ('dd-menu-' + size) : null,
      { 'dd-menu-open': this.props.isOpen },
      this.props.menuClassName,
    );

    const { textAlign, upwards, animAlign, animate, enterTimeout, leaveTimeout } = this.props;

    const listClassName = 'dd-items-' + (textAlign || align);
    const transitionProps = {
      transitionName: 'grow-from-' + (upwards ? 'up-' : '') + (animAlign || align),
      component: 'div',
      className: classnames('dd-menu-items', { 'dd-items-upwards': upwards }),
      onKeyDown: this.handleKeyDown,
      transitionEnter: animate,
      transitionLeave: animate,
      transitionEnterTimeout: enterTimeout,
      transitionLeaveTimeout: leaveTimeout,
    };

    return (
      <div className={classnames('dd-menu-wrap', className)} ref={this._registerWrapperRef}>
        {this.props.toggle}
        <Portal node={this.props.portalNode || root} ref={this._registerPortalRef}>
          <div className={menuClassName}  style={{
            position: this.props.fixed ? 'fixed' : 'absolute',
            top: !upwards ? (this.state.dropdownTopOffset + this.state.dropdownToggleComponentHeight) : this.state.dropdownTopOffset,
            left: alignment === 'left' ? this.state.dropdownLeftOffset :
            alignment === 'center' && this.state.dropdownWidth != null ? (
              this.state.dropdownLeftOffset + (
                (this.state.dropdownToggleComponentWidth - this.state.dropdownWidth) / 2
              )
            ) : 'initial',
            right: alignment === 'right' ? this.state.dropdownRightOffset : 'initial'
          }}>
            <CSSTransitionGroup {...transitionProps}>
              {this.props.isOpen &&
              <ChildWrapper hide={this.state.dropdownWidth == null} setWidth={this._setDropdownWidth}>
                <ul key="items" className={listClassName}>
                  {this.props.children}
                </ul>
              </ChildWrapper>
              }
            </CSSTransitionGroup>
          </div>
        </Portal>
      </div>
    );
  }

}

class ChildWrapper extends PureComponent {
    componentDidMount() {
        this.props.setWidth(this._ref.getBoundingClientRect().width)
    }

    _regRef = (ref) => this._ref = ref

    render() {
        const style = this.props.hide ? { visibility: 'hidden' } : null
        return <div style={style} ref={this._regRef}>{this.props.children}</div>
    }
}
