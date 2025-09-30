/**
 * Example component demonstrating how to use the help links utility
 * This shows how any component can use the help-links utility
 */

'use client';

import {
    createHelpDocLink,
    createHelpSearchLink,
    createHelpCategoryLink,
    HelpLinkFormatter,
    COMMON_HELP_LINKS,
    HELP_PATHS
} from '@/utils/help-links';

export function HelpLinkExample() {
    // Example 1: Basic help doc link
    const gettingStartedLink = createHelpDocLink(
        HELP_PATHS.GETTING_STARTED,
        'Getting Started Guide',
        { external: true }
    );

    // Example 2: Search link
    const searchLink = createHelpSearchLink('upload data', 'Search for upload help');

    // Example 3: Category link
    const workflowsLink = createHelpCategoryLink('Workflows & Automation', 'Workflows');

    // Example 4: Using formatters
    const chatLink = HelpLinkFormatter.forChat(HELP_PATHS.TASKS, 'Tasks Management');
    const adminLink = HelpLinkFormatter.forAdmin(HELP_PATHS.INTEGRATIONS, 'Integrations');

    // Example 5: Using common links
    const commonLinks = [
        COMMON_HELP_LINKS.gettingStarted(),
        COMMON_HELP_LINKS.workflows(),
        COMMON_HELP_LINKS.tasks()
    ];

    return (
        <div className="space-y-6 p-6">
            <h2 className="text-2xl font-bold">Help Links Utility Examples</h2>

            {/* Basic Link */}
            <div>
                <h3 className="text-lg font-semibold mb-2">Basic Help Doc Link:</h3>
                <a
                    href={gettingStartedLink.url}
                    target={gettingStartedLink.attributes.target}
                    className={gettingStartedLink.attributes.class}
                    rel={gettingStartedLink.attributes.rel}
                >
                    {gettingStartedLink.text}
                </a>
            </div>

            {/* Search Link */}
            <div>
                <h3 className="text-lg font-semibold mb-2">Search Link:</h3>
                <a
                    href={searchLink.url}
                    target={searchLink.attributes.target}
                    className={searchLink.attributes.class}
                    rel={searchLink.attributes.rel}
                >
                    {searchLink.text}
                </a>
            </div>

            {/* Category Link */}
            <div>
                <h3 className="text-lg font-semibold mb-2">Category Link:</h3>
                <a
                    href={workflowsLink.url}
                    target={workflowsLink.attributes.target}
                    className={workflowsLink.attributes.class}
                    rel={workflowsLink.attributes.rel}
                >
                    {workflowsLink.text}
                </a>
            </div>

            {/* Formatted Links */}
            <div>
                <h3 className="text-lg font-semibold mb-2">Formatted Links:</h3>
                <div className="space-y-2">
                    <div>
                        <span className="font-medium">Chat Link: </span>
                        <a
                            href={chatLink.url}
                            target={chatLink.attributes.target}
                            className={chatLink.attributes.class}
                            rel={chatLink.attributes.rel}
                        >
                            {chatLink.text}
                        </a>
                    </div>
                    <div>
                        <span className="font-medium">Admin Link: </span>
                        <a
                            href={adminLink.url}
                            target={adminLink.attributes.target}
                            className={adminLink.attributes.class}
                            rel={adminLink.attributes.rel}
                        >
                            {adminLink.text}
                        </a>
                    </div>
                </div>
            </div>

            {/* Common Links */}
            <div>
                <h3 className="text-lg font-semibold mb-2">Common Help Links:</h3>
                <div className="flex flex-wrap gap-2">
                    {commonLinks.map((link, index) => (
                        <a
                            key={index}
                            href={link.url}
                            target={link.attributes.target}
                            className={link.attributes.class}
                            rel={link.attributes.rel}
                        >
                            {link.text}
                        </a>
                    ))}
                </div>
            </div>

            {/* HTML Generation Example */}
            <div>
                <h3 className="text-lg font-semibold mb-2">HTML Generation:</h3>
                <div
                    className="prose prose-sm"
                    dangerouslySetInnerHTML={{
                        __html: `
              <p>Here's a help link: ${createHelpDocLink(HELP_PATHS.COMMUNICATION, 'Communication Settings', { external: true }).url}</p>
            `
                    }}
                />
            </div>
        </div>
    );
}
