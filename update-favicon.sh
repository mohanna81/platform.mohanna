#!/bin/bash
# Script to update favicon version and force browser refresh
# This should be run whenever you want to force all browsers to reload the favicon

# Update the favicon version in .env.local
NEW_VERSION=$(date +%s)
if [ -f ".env.local" ]; then
    # Check if NEXT_PUBLIC_FAVICON_VERSION exists
    if grep -q "NEXT_PUBLIC_FAVICON_VERSION" .env.local; then
        # Update existing version
        sed -i.bak "s/NEXT_PUBLIC_FAVICON_VERSION=.*/NEXT_PUBLIC_FAVICON_VERSION=$NEW_VERSION/" .env.local
        rm .env.local.bak 2>/dev/null
        echo "Updated NEXT_PUBLIC_FAVICON_VERSION to $NEW_VERSION in .env.local"
    else
        # Add new version
        echo "NEXT_PUBLIC_FAVICON_VERSION=$NEW_VERSION" >> .env.local
        echo "Added NEXT_PUBLIC_FAVICON_VERSION=$NEW_VERSION to .env.local"
    fi
else
    # Create .env.local with version
    echo "NEXT_PUBLIC_FAVICON_VERSION=$NEW_VERSION" > .env.local
    echo "Created .env.local with NEXT_PUBLIC_FAVICON_VERSION=$NEW_VERSION"
fi

# Clean build cache
echo "Cleaning build cache..."
rm -rf .next

echo "Favicon version updated! Run 'npm run build' or 'npm run dev' to apply changes."
