import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {

  LogOutIcon,
  Menu,
  X,
} from "lucide-react";
// import {
//   NavigationMenu,
//   NavigationMenuContent,
//   NavigationMenuItem,
//   NavigationMenuLink,
//   NavigationMenuList,
//   NavigationMenuTrigger,
// } from "./ui/navigation-menu";
// import { NAV_ITEMS } from "@/lib/constants/nav-items";
// import { useIsMobile } from "@/hooks/useMobile";
// import UserDropDown from "./UserDropDown";
// import MobileNav from "./MobileNav";
import { NAV_ITEMS } from "../lib/constants/nav-item";
import { useIsMobile } from "../hooks/useMobile";
import UserDropDown from "./UserDropDown";
import MobileNav from "./MobileNav";
import {  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger, } from "@/components/ui/navigation-menu";
  import img from "../assets/image2.png"
import { useAuthV2 } from "@/features/authentication-v2/use-auth-v2";


// export default function Navbar() {
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const isMobile = useIsMobile();

//   const handleLinkClick = () => {
//     setMobileOpen(false); // close mobile when link clicked
//   };

//   return (
//     <header className=" sticky flex items-center justify-between bg-white px-4 md:px-6 py-1 shadow-md  top-0 z-102">
//       {/* Logo */}
//       <div className="flex items-center gap-2">
//         {/* Mobile Menu Button */}
//       <button
//         onClick={() => setMobileOpen(!mobileOpen)}
//         className="md:hidden p-2 rounded hover:bg-gray-100"
//       >
//         {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
//       </button>
//         <img
//           // src="https://revinns.com/wp-content/uploads/2023/03/E2-B-1.png"
//           src={img}
//           alt="Logo"
//           className="w-24 md:w-28"
//         />
//       </div>

      

//       {/* desktop nav */}
//       <NavigationMenu viewport={isMobile} className="hidden md:block">
//         <NavigationMenuList className="flex-wrap">
//           {NAV_ITEMS.map((item, idx) => (
//             <NavigationMenuItem key={idx}>
//               <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
//               <NavigationMenuContent>
//                 {item.links.map((linkItem, linkItemIndex) => (
//                   <NavLink
//                     to={linkItem.to}
//                     end
//                     key={linkItemIndex}
//                     onClick={handleLinkClick}
//                     className={({ isActive }) =>
//                       `  px-4 py-2 w-48 flex items-center gap-2  text-sm font-sans rounded-lg cursor-pointer ${
//                         isActive
//                           ? "text-green-700 font-medium bg-green-50"
//                           : " hover:bg-green-100 transition-colors duration-300"
//                       }`
//                     }
//                   >
//                     {linkItem.Icon && (
//                       <linkItem.Icon className="w-4 h-4  shrink-0" />
//                     )}
//                     {linkItem.label}
//                   </NavLink>
//                 ))}
//               </NavigationMenuContent>
//             </NavigationMenuItem>
//           ))}
//         </NavigationMenuList>
//       </NavigationMenu>

//       {/* Right Side: User Info */}
//       <div className="flex items-center gap-4">
//         <UserDropDown />
//       </div>

      

      
//       <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
//     </header>
//   );
// }



export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuthV2(); // ← যোগ করো
  console.log(user?.roles);
  // temporarily add করো
console.log("auth user:", user);

  // Role check helper
  

const canSee = (roles) =>
  !roles || roles.some((r) => user?.roles?.includes(r));

  const handleLinkClick = () => setMobileOpen(false);

  return (
    <header className="sticky flex items-center justify-between bg-white px-4 md:px-6 py-1 shadow-md top-0 z-102">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded hover:bg-gray-100">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <img src={img} alt="Logo" className="w-24 md:w-28" />
      </div>

      {/* Desktop Nav */}
      <NavigationMenu viewport={isMobile} className="hidden md:block">
        <NavigationMenuList className="flex-wrap">
          {NAV_ITEMS.filter((item) => canSee(item.roles)).map((item, idx) => ( // ← filter যোগ
            <NavigationMenuItem key={idx}>
              <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
              <NavigationMenuContent>
                {item.links.map((linkItem, linkItemIndex) => (
                  <NavLink
                    to={linkItem.to}
                    end
                    key={linkItemIndex}
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                      `px-4 py-2 w-48 flex items-center gap-2 text-sm font-sans rounded-lg cursor-pointer ${
                        isActive ? "text-green-700 font-medium bg-green-50" : "hover:bg-green-100 transition-colors duration-300"
                      }`
                    }
                  >
                    {linkItem.Icon && <linkItem.Icon className="w-4 h-4 shrink-0" />}
                    {linkItem.label}
                  </NavLink>
                ))}
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-4">
        <UserDropDown />
      </div>

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
    </header>
  );
}