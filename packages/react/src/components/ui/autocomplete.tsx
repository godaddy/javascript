import {
  FloatingFocusManager,
  FloatingPortal,
  flip,
  size,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
} from '@floating-ui/react';
import { LoaderCircle, Search } from 'lucide-react';
import * as React from 'react';
import { useGoDaddyContext } from '@/godaddy-provider';
import { cn } from '@/lib/utils';
import { Input } from './input';

type Address = {
  addressLine1: string | null;
  addressLine2: string | null;
  adminArea1: string | null;
  adminArea3: string | null;
  countryCode: string | null;
  postalCode: string | null;
};

type AutoCompleteItemProps = {
  active: boolean;
} & React.HTMLProps<HTMLDivElement>;

const AutoCompleteItem = React.forwardRef<
  HTMLDivElement,
  AutoCompleteItemProps
>(({ children, active, key, ...rest }, ref) => {
  const id = React.useId();

  return (
    <div
      id={id}
      key={key}
      ref={ref}
      role='menuitem'
      tabIndex={0}
      className={cn(active && 'bg-muted', 'py-1 px-2 rounded')}
      aria-selected={active}
      {...rest}
    >
      {children}
    </div>
  );
});

type AutoCompleteProps<T extends string> = {
  value: T;
  data: Address[] | [];
  onChange: (value: string | null) => void;
  onSelect: (address: Address) => void;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
  disabled?: boolean;
  hasError?: boolean;
};

export function AutoComplete<T extends string>({
  value,
  data = [],
  onChange,
  onSelect,
  onOpenChange,
  isLoading = false,
  hasError = false,
  disabled = false,
}: AutoCompleteProps<T>) {
  const { t } = useGoDaddyContext();
  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const [hasSelected, setHasSelected] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const floating = useFloating({
    open,
    onOpenChange: setOpen,
    middleware: [
      flip({ padding: 10 }),
      size({
        apply({ rects, availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
            maxHeight: `${availableHeight}px`,
          });
        },
        padding: 10,
      }),
    ],
  });

  const role = useRole(floating.context, { role: 'listbox' });
  const dismiss = useDismiss(floating.context);
  const listNav = useListNavigation(floating.context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    virtual: true,
    loop: true,
  });

  const interactions = useInteractions([role, dismiss, listNav]);

  function handleOnChange(event: React.ChangeEvent<HTMLInputElement>) {
    const inputValue = event.target.value;
    onChange(inputValue);

    if (hasSelected && inputValue) {
      setOpen(true);
      setActiveIndex(0);
    } else {
      setOpen(false);
    }
  }

  function handleOnKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && activeIndex != null && data[activeIndex]) {
      event.preventDefault();
      onChange(data[activeIndex].addressLine1);
      onSelect(data[activeIndex]);
      setActiveIndex(null);
      setOpen(false);
      setHasSelected(true);
    }
  }

  function handleOnClick(address: Address) {
    onChange(address.addressLine1);
    onSelect(address);
    setOpen(false);
    setHasSelected(true);
    (floating.refs.domReference.current as HTMLElement | null)?.focus();
  }

  React.useEffect(() => {
    if (!hasSelected) {
      if (value && data.length > 0) {
        setOpen(true);
        setActiveIndex(0);
      } else {
        setOpen(false);
      }
    }
  }, [value, data.length, hasSelected]);

  // Notify parent of open state changes
  React.useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  return (
    <div>
      <div className='relative'>
        <Input
          {...interactions.getReferenceProps({
            ref: floating.refs.setReference,
            value: value,
            onChange: handleOnChange,
            onKeyDown: handleOnKeyDown,
            placeholder: t.ui.autocomplete.addressPlaceholder,
            'aria-autocomplete': 'list',
            autoComplete: 'off',
          })}
          disabled={disabled}
          hasError={hasError}
          className='pr-9'
        />
        {isLoading ? (
          <LoaderCircle className='absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin' />
        ) : (
          <Search className='absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground h-4 w-4' />
        )}
      </div>
      {open ? (
        <FloatingPortal>
          <FloatingFocusManager
            visuallyHiddenDismiss
            context={floating.context}
            initialFocus={-1}
          >
            <div
              {...interactions.getFloatingProps({
                ref: floating.refs.setFloating,
                style: {
                  ...floating.floatingStyles,
                },
              })}
              className='z-50 overflow-y-auto rounded border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
            >
              <div className='py-1 pb-2 px-2 text-muted-foreground text-xs border-b border-border mb-1'>
                <span>{t.ui.autocomplete.suggestions}</span>
              </div>
              {data?.map((address, index) => (
                <AutoCompleteItem
                  key={`address.addressLine1-${index}`}
                  {...interactions.getItemProps({
                    ref(node) {
                      listRef.current[index] = node;
                    },
                    onClick: () => handleOnClick(address),
                  })}
                  active={activeIndex === index}
                >{`${address.addressLine1}, ${address.adminArea3}, ${address.adminArea1} ${address.postalCode}`}</AutoCompleteItem>
              ))}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      ) : null}
    </div>
  );
}
