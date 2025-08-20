"use client";

import Image from "next/image";
import { ShapesMenuProps } from "@/types/type";

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";

const ShapesMenu = ({
  item,
  activeElement,              // ActiveElement | null
  handleActiveElement,         // (el: ActiveElement) => void
  handleImageUpload,
  imageInputRef,
}: ShapesMenuProps) => {
  // helper to check if a given value matches the current active element
  const isActive = (val?: string) => !!activeElement && activeElement.value === val;

  // are we currently showing a specific option from this dropdown as active?
  const isDropdownElem =
    !!activeElement && item.value.some((elem) => elem && elem.value === activeElement.value);

  const triggerIconSrc = isDropdownElem
    ? (activeElement!.icon as string)
    : (item.icon as string);

  return (
    <>
      <DropdownMenu>
        {/* No need to call handleActiveElement here; this just opens the menu */}
        <DropdownMenuTrigger asChild className="no-ring">
          <Button className="relative h-5 w-5 object-contain">
            <Image
              src={triggerIconSrc}
              alt={item.name}
              fill
              className={isDropdownElem ? "invert" : ""}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="mt-5 flex flex-col gap-y-1 border-none bg-primary-black py-4 text-white">
          {item.value.map((elem) => {
            if (!elem) return null; // guard against null entries
            const active = isActive(elem.value);
            return (
              <Button
                key={elem.name}
                onClick={() => handleActiveElement(elem)}
                className={`flex h-fit justify-between gap-10 rounded-none px-5 py-3 focus:border-none ${
                  active ? "bg-primary-green" : "hover:bg-primary-grey-200"
                }`}
              >
                <div className="group flex items-center gap-2">
                  <Image
                    src={elem.icon}
                    alt={elem.name}
                    width={20}
                    height={20}
                    className={active ? "invert" : ""}
                  />
                  <p className={`text-sm ${active ? "text-primary-black" : "text-white"}`}>
                    {elem.name}
                  </p>
                </div>
              </Button>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        type="file"
        className="hidden"
        ref={imageInputRef}
        accept="image/*"
        onChange={handleImageUpload}
      />
    </>
  );
};

export default ShapesMenu;
