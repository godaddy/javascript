'use client';

import { Search, X } from 'lucide-react';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useGoDaddyContext } from '@/godaddy-provider';

interface ProductSearchProps {
  showButton?: boolean;
  onSearch?: (query: string) => void;
}

interface SearchFormValues {
  query: string;
}

export function ProductSearch({
  showButton = false,
  onSearch,
}: ProductSearchProps) {
  const { t } = useGoDaddyContext();
  const form = useForm<SearchFormValues>({
    defaultValues: {
      query: '',
    },
  });

  const [hasUrlQuery, setHasUrlQuery] = React.useState(false);

  // Sync form with URL and track if URL has query param
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || '';
      setHasUrlQuery(!!q);
      if (q) {
        form.setValue('query', q);
      }
    };

    // Initial sync
    updateFromUrl();

    // Listen for URL changes
    const handleUrlChange = () => {
      updateFromUrl();
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('urlchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('urlchange', handleUrlChange);
    };
  }, [form]);

  const handleSubmit = (values: SearchFormValues) => {
    if (!values.query.trim()) {
      return;
    }

    if (onSearch) {
      onSearch(values.query);
    } else {
      // Update URL with query parameter, preserving existing params
      const url = new URL(window.location.href);
      url.searchParams.set('q', values.query);
      window.history.pushState({}, '', url.toString());

      // Dispatch custom event to notify components of URL change
      window.dispatchEvent(new CustomEvent('urlchange'));
      setHasUrlQuery(true);
    }
  };

  const handleClear = () => {
    form.setValue('query', '');

    if (onSearch) {
      onSearch('');
    } else {
      // Remove query parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('q');
      window.history.pushState({}, '', url.toString());

      // Dispatch custom event to notify components of URL change
      window.dispatchEvent(new CustomEvent('urlchange'));
      setHasUrlQuery(false);
    }
  };

  // Determine which icon to show inside the input
  const showClearIcon = hasUrlQuery;
  const showSearchIcon = !hasUrlQuery && !showButton;
  const inputPadding = showClearIcon || showSearchIcon ? 'pr-10' : '';

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className='flex gap-2 w-full'
      >
        <FormField
          control={form.control}
          name='query'
          render={({ field }) => (
            <FormItem className='flex-1 relative'>
              <FormControl>
                <div className='relative'>
                  <Input
                    type='text'
                    placeholder={t.storefront.searchPlaceholder}
                    {...field}
                    className={inputPadding}
                  />
                  {showClearIcon && (
                    <button
                      type='button'
                      onClick={handleClear}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                      aria-label='Clear search'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  )}
                  {showSearchIcon && (
                    <button
                      type='submit'
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                      aria-label='Search'
                    >
                      <Search className='h-4 w-4' />
                    </button>
                  )}
                </div>
              </FormControl>
            </FormItem>
          )}
        />
        {showButton && (
          <Button type='submit' size='default' className='gap-2 h-12'>
            <Search className='h-4 w-4' />
            {t.storefront.search}
          </Button>
        )}
      </form>
    </Form>
  );
}

export type { ProductSearchProps };
