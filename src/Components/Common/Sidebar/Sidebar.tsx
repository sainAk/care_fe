import { createContext, useContext, useEffect, useRef, useState } from "react";
import { SidebarItem, ShrinkedSidebarItem } from "./SidebarItem";
import SidebarUserCard from "./SidebarUserCard";
import NotificationItem from "../../Notifications/NotificationsList";
import useActiveLink from "../../../Common/hooks/useActiveLink";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import useConfig from "../../../Common/hooks/useConfig";
import SlideOver from "../../../CAREUI/interactive/SlideOver";
import { classNames } from "../../../Utils/utils";
import { Link } from "raviger";

export const SIDEBAR_SHRINK_PREFERENCE_KEY = "sidebarShrinkPreference";

const LOGO_COLLAPSE = "/images/logo_collapsed.svg";

type StatelessSidebarProps =
  | {
      shrinkable: true;
      shrinked: boolean;
      setShrinked: (state: boolean) => void;
      onItemClick?: undefined;
    }
  | {
      shrinkable?: false;
      shrinked?: false;
      setShrinked?: undefined;
      onItemClick: (open: boolean) => void;
    };

const NavItems = [
  { text: "Facilities", to: "/facility", icon: "care-l-hospital" },
  { text: "Patients", to: "/patients", icon: "care-l-user-injured" },
  { text: "Assets", to: "/assets", icon: "care-l-shopping-cart-alt" },
  { text: "Sample Test", to: "/sample", icon: "care-l-medkit" },
  { text: "Shifting", to: "/shifting", icon: "care-l-ambulance" },
  { text: "Resource", to: "/resource", icon: "care-l-heart-medical" },
  {
    text: "External Results",
    to: "/external_results",
    icon: "care-l-clipboard-notes",
  },
  { text: "Users", to: "/users", icon: "care-l-users-alt" },
  { text: "Notice Board", to: "/notice_board", icon: "care-l-meeting-board" },
];

const StatelessSidebar = ({
  shrinkable = false,
  shrinked = false,
  setShrinked,
  onItemClick,
}: StatelessSidebarProps) => {
  const { main_logo } = useConfig();
  const activeLink = useActiveLink();
  const Item = shrinked ? ShrinkedSidebarItem : SidebarItem;
  const { dashboard_url } = useConfig();

  const indicatorRef = useRef<HTMLDivElement>(null);
  const [lastIndicatorPosition, setLastIndicatorPosition] = useState(0);
  const [isOverflowVisible, setOverflowVisisble] = useState(false);

  useEffect(() => {
    if (!indicatorRef.current) return;
    const index = NavItems.findIndex((item) => item.to === activeLink);
    if (index !== -1) {
      // Haha math go brrrrrrrrr

      const e = indicatorRef.current;

      const itemHeight = 44;
      const bottomItemOffset = 2;

      const indexDifference = index - lastIndicatorPosition;
      e.style.display = "block";

      if (indexDifference > 0) {
        e.style.top = lastIndicatorPosition * itemHeight + 16 + "px";
        e.style.bottom = "auto";
      } else {
        e.style.bottom =
          itemHeight * (NavItems.length + bottomItemOffset) -
          lastIndicatorPosition * itemHeight -
          28 +
          "px";
        e.style.top = "auto";
      }

      const variableHeight = Math.min(
        Math.abs(indexDifference) * itemHeight,
        70
      );

      e.style.height = `${variableHeight}px`;
      setTimeout(() => {
        if (!e) return;
        if (indexDifference > 0) {
          e.style.top = index * itemHeight + 16 + "px";
          e.style.bottom = "auto";
        } else {
          e.style.bottom =
            itemHeight * (NavItems.length + bottomItemOffset) -
            index * itemHeight -
            28 +
            "px";
          e.style.top = "auto";
        }
        e.style.height = "0.75rem";
        setLastIndicatorPosition(index);
      }, 300);
    } else {
      indicatorRef.current.style.display = "none";
    }
  }, [activeLink]);
  const handleOverflow = (value: boolean) => {
    setOverflowVisisble(value);
  };

  return (
    <nav
      className={`group flex h-screen flex-col bg-primary-800 py-3 md:py-5 ${
        shrinked ? "w-14" : "w-60"
      } transition-all duration-300 ease-in-out ${
        isOverflowVisible && shrinked
          ? " overflow-visible "
          : " overflow-y-auto overflow-x-hidden "
      }`}
    >
      <div className="h-3" /> {/* flexible spacing */}
      <Link href="/">
        <img
          className={`${
            shrinked ? "mx-auto" : "ml-5"
          } mb-2 h-5 self-start transition md:mb-5 md:h-8`}
          src={shrinked ? LOGO_COLLAPSE : main_logo.light}
        />
      </Link>
      <div className="h-3" /> {/* flexible spacing */}
      <div className="relative mb-4 flex h-full flex-col md:mb-0">
        <div className="relative flex flex-1 flex-col md:flex-none">
          <div
            ref={indicatorRef}
            // className="absolute left-2 w-1 hidden md:block bg-primary-400 rounded z-10 transition-all"
            className={classNames(
              "absolute left-2 z-10 block w-1 rounded bg-primary-400 transition-all",
              activeLink ? "opacity-0 md:opacity-100" : "opacity-0"
            )}
          />
          {NavItems.map((i) => {
            return (
              <Item
                key={i.text}
                {...i}
                icon={<CareIcon className={`${i.icon} h-5`} />}
                selected={i.to === activeLink}
                do={() => onItemClick && onItemClick(false)}
                handleOverflow={handleOverflow}
              />
            );
          })}

          <NotificationItem
            shrinked={shrinked}
            handleOverflow={handleOverflow}
            onClickCB={() => onItemClick && onItemClick(false)}
          />
          <Item
            text="Dashboard"
            to={dashboard_url}
            icon={<CareIcon className="care-l-dashboard text-lg" />}
            external
            handleOverflow={handleOverflow}
          />
        </div>
        <div className="hidden md:block md:flex-1" />

        <div className="relative flex justify-end">
          {shrinkable && (
            <div
              className={`${
                shrinked ? "mx-auto" : "self-end"
              } flex h-12 translate-y-4 self-end opacity-0 transition-all duration-200 ease-in-out group-hover:translate-y-0 group-hover:opacity-100`}
            >
              <ToggleShrink
                shrinked={shrinked}
                toggle={() => setShrinked && setShrinked(!shrinked)}
              />
            </div>
          )}
        </div>
        <SidebarUserCard shrinked={shrinked} />
      </div>
    </nav>
  );
};

export const SidebarShrinkContext = createContext<{
  shrinked: boolean;
  setShrinked: (state: boolean) => void;
}>({
  shrinked: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setShrinked: () => {},
});

export const DesktopSidebar = () => {
  const { shrinked, setShrinked } = useContext(SidebarShrinkContext);
  return (
    <StatelessSidebar
      shrinked={shrinked}
      setShrinked={setShrinked}
      shrinkable
    />
  );
};

interface MobileSidebarProps {
  open: boolean;
  setOpen: (state: boolean) => void;
}

export const MobileSidebar = (props: MobileSidebarProps) => {
  return (
    <SlideOver {...props} slideFrom="left" onlyChild>
      <StatelessSidebar onItemClick={props.setOpen} />
    </SlideOver>
  );
};

interface ToggleShrinkProps {
  shrinked: boolean;
  toggle: () => void;
}

const ToggleShrink = ({ shrinked, toggle }: ToggleShrinkProps) => (
  <div
    className={`flex h-10 w-10 cursor-pointer items-center justify-center self-end rounded bg-primary-800 text-gray-100 text-opacity-70 hover:bg-primary-700 hover:text-opacity-100 ${
      shrinked ? "mx-auto" : "mr-4"
    } transition-all duration-200 ease-in-out`}
    onClick={toggle}
  >
    <i
      className={`fa-solid fa-chevron-up ${
        shrinked ? "rotate-90 text-sm" : "-rotate-90 text-base"
      } transition-all delay-150 duration-300 ease-out`}
    />
  </div>
);
