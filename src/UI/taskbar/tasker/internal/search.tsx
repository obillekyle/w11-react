import UI from '../../../../ui/application';
import { Icon } from '@iconify/react';
import Taskbar from '../..';
import './search.scss';

const SearchButton = () => {
  return (
    <Taskbar.Popover
      hover
      position="top"
      transition={'slide-up'}
      transitionDuration={200}
      zIndex={5}
      withinPortal={true}
      offset={16}
      transitionDelay={500}
      exitTransitionDuration={600}
      target={
        <Taskbar.Button className="search-menu">
          <svg data-src="/assets/taskbar/search.svg" width="1em" height="1em" />
        </Taskbar.Button>
      }
    >
      <div className="search-container">
        <UI.Input
          icon={<Icon icon="fluent:search-24-filled" height={20} />}
          placeholder="Type here to search"
          width={256}
          height={40}
        />
      </div>
    </Taskbar.Popover>
  );
};

export default SearchButton;
