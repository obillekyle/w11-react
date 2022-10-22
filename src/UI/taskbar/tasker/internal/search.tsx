import Taskbar from "../..";

const SearchButton = () => {
  return (
    <Taskbar.Popover
      hover
      position="top"
      transition={"slide-up"}
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
      <div>Test</div>
    </Taskbar.Popover>
  );
};

export default SearchButton;
