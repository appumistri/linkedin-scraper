const { 
    LinkedinScraper,
    relevanceFilter,
    timeFilter,
    typeFilter,
    experienceLevelFilter,
    events,
} = require("linkedin-jobs-scraper");

(async () => {
    // Each scraper instance is associated with one browser.
    // Concurrent queries will run on different pages within the same browser instance.
    const scraper = new LinkedinScraper({
        headless: true,
        slowMo: 200,
        args: [
            "--lang=en-GB",
        ],
    });

    // Add listeners for scraper events
    
    // Emitted once for each processed job
    scraper.on(events.scraper.data, (data) => {
        console.log(
            data.description.length,
            data.descriptionHTML.length,
            `Query='${data.query}'`,
            `Location='${data.location}'`,
            `Id='${data.jobId}'`,
            `Title='${data.title}'`,
            `Company='${data.company ? data.company : "N/A"}'`,
            `CompanyLink='${data.companyLink ? data.companyLink : "N/A"}'`,
            `CompanyImgLink='${data.companyImgLink ? data.companyImgLink : "N/A"}'`,
            `Place='${data.place}'`,
            `Date='${data.date}'`,
            `Link='${data.link}'`,
            `applyLink='${data.applyLink ? data.applyLink : "N/A"}'`,
            `insights='${data.insights}'`,
        );
    });
    
    // Emitted once for each scraped page
    scraper.on(events.scraper.metrics, (metrics) => {
        console.log(`Processed=${metrics.processed}`, `Failed=${metrics.failed}`, `Missed=${metrics.missed}`);        
    });

    scraper.on(events.scraper.error, (err) => {
        console.error(err);
    });

    scraper.on(events.scraper.end, () => {
        console.log('All done!');
    });

    // Custom function executed on browser side to extract job description [optional]
    const descriptionFn = () => document.querySelector(".jobs-description")
        .innerText
        .replace(/[\s\n\r]+/g, " ")
        .trim();

    // Run queries concurrently    
    await Promise.all([
        // Run queries serially
        scraper.run([
            {
                query: "Engineer",
                options: {
                    locations: ["United States"], // This will override global options ["Europe"]
                    filters: {
                        type: [typeFilter.FULL_TIME, typeFilter.CONTRACT]    
                    },       
                }                                                       
            },
            {
                query: "Sales",
                options: {                    
                    limit: 10, // This will override global option limit (33)
                    applyLink: false, // Try to extract apply link. Default to true.
                    descriptionFn: descriptionFn, // Custom job description processor
                }
            },
        ], { // Global options, will be merged individually with each query options
            locations: ["Europe"],
            limit: 33,
        }),
    ]);

    // Close browser
    await scraper.close();
})();